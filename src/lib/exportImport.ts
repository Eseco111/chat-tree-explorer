import { v4 as uuidv4 } from 'uuid';
import type { ConversationMeta, ConversationTree } from '../types';
import {
  loadConversationTree,
  saveConversationTree,
  saveMeta,
} from './db';

/** 桌面端导出：下载 JSON 文件 */
export async function exportConversation(id: string, meta: ConversationMeta): Promise<void> {
  const tree = await loadConversationTree(id);
  if (!tree) {
    alert('对话数据不存在，无法导出');
    return;
  }
  const data = { meta, tree };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${meta.title}-${new Date(meta.createdAt).toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 桌面端文件导入 */
export function importConversation(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const raw = e.target?.result;
        if (typeof raw !== 'string') throw new Error('无法读取文件内容');
        const result = await processImportText(raw);
        resolve(result.success);
      } catch (err) {
        console.error('导入失败:', err);
        resolve(false);
      }
    };
    reader.onerror = () => resolve(false);
    reader.readAsText(file);
  });
}

/** 移动端粘贴导入 */
export async function importConversationFromText(text: string): Promise<boolean> {
  const result = await processImportText(text);
  if (!result.success && result.error) {
    alert(`导入失败：${result.error}`);
  }
  return result.success;
}

/** 移动端导出到剪贴板 */
export async function exportConversationToClipboard(id: string, meta: ConversationMeta): Promise<boolean> {
  const tree = await loadConversationTree(id);
  if (!tree) {
    alert('对话数据不存在');
    return false;
  }
  const data = { meta, tree };
  try {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error('复制失败', err);
    return false;
  }
}

/** 通用文本导入逻辑：清洗、解析、校验，并创建全新对话（不覆盖已有） */
async function processImportText(raw: string): Promise<{ success: boolean; error?: string }> {

  const MAX_SAFE_LENGTH = 3000;
  if (raw.length > MAX_SAFE_LENGTH) {
    return {
      success: false,
      error: `文本过长（${raw.length} 字符），微信可能已截断。请尝试分段复制或使用电脑端导入。`,
    };
  }
  try {
    // 1. 去除 BOM 头和首尾空格
    let clean = raw.replace(/^\uFEFF/, '').trim();
    if (!clean) {
      return { success: false, error: '粘贴内容为空' };
    }

    // 2. 去除零宽字符（如微信等平台可能插入）
    clean = clean.replace(/[\u200B-\u200D\uFEFF]/g, '');

    // 3. 解析 JSON
    let json: unknown;
    try {
      json = JSON.parse(clean);
    } catch (parseErr: unknown) {
      const message = parseErr instanceof Error ? parseErr.message : String(parseErr);
      return { success: false, error: `JSON 格式错误：${message}` };
    }

    // 4. 校验结构
    if (typeof json !== 'object' || json === null) {
      return { success: false, error: '数据格式不正确' };
    }
    if (!('meta' in json && 'tree' in json)) {
      return { success: false, error: '缺少 meta 或 tree 字段' };
    }

    const data = json as { meta: ConversationMeta; tree: ConversationTree };
    const originalMeta = data.meta;
    const tree = data.tree;

    if (!originalMeta.title || !tree.rootId || !tree.nodes) {
      return { success: false, error: '数据不完整：缺少标题或树结构' };
    }

    // 5. 创建全新对话（使用新 ID，避免覆盖）
    const newId = uuidv4();
    const newMeta: ConversationMeta = {
      id: newId,
      title: originalMeta.title,
      createdAt: Date.now(),
      activeModelId: null,
    };

    await saveMeta(newMeta);
    await saveConversationTree(newId, tree);

    // 6. 更新 Store
    const { useTreeStore } = await import('../store/useTreeStore');
    const store = useTreeStore.getState();
    const newMetaMap = { ...store.meta, [newId]: newMeta };
    const newTrees = { ...store.trees, [newId]: tree };

    if (!store.activeId) {
      useTreeStore.setState({
        meta: newMetaMap,
        trees: newTrees,
        activeId: newId,
        tree,
      });
    } else {
      useTreeStore.setState({
        meta: newMetaMap,
        trees: newTrees,
      });
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('导入失败:', err);
    const message = err instanceof Error ? err.message : '未知错误';
    return { success: false, error: message };
  }
}