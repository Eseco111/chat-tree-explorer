import { v4 as uuidv4 } from 'uuid';
import type { ConversationMeta, ConversationTree } from '../types';
import {
  loadConversationTree,
  saveConversationTree,
  saveMeta,
} from './db';

/**
 * 导出单个对话为 JSON 文件并触发浏览器下载（桌面端）
 */
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

/**
 * 桌面端文件导入：读取 File 并导入为新对话
 */
export function importConversation(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const raw = e.target?.result;
        if (typeof raw !== 'string') throw new Error('无法读取文件内容');
        const success = await processImportText(raw);
        resolve(success);
      } catch (err) {
        console.error('导入失败:', err);
        resolve(false);
      }
    };
    reader.onerror = () => resolve(false);
    reader.readAsText(file);
  });
}

/**
 * 移动端粘贴导入：将 JSON 文本导入为新对话
 */
export async function importConversationFromText(text: string): Promise<boolean> {
  return processImportText(text);
}

/**
 * 通用文本导入逻辑：解析并存储为新对话（不覆盖已有）
 */
async function processImportText(raw: string): Promise<boolean> {
  try {
    // 去除 BOM 头和首尾空格
    const clean = raw.replace(/^\uFEFF/, '').trim();
    if (!clean) throw new Error('内容为空');
    const json = JSON.parse(clean);
    if (!json.meta || !json.tree) throw new Error('缺少 meta 或 tree');
    const originalMeta = json.meta as ConversationMeta;
    const tree = json.tree as ConversationTree;

    // 基本完整性校验
    if (!originalMeta.title || !tree.rootId || !tree.nodes) {
      throw new Error('数据不完整：缺少标题或树结构');
    }

    // 创建全新对话（防止覆盖）
    const newId = uuidv4();
    const newMeta: ConversationMeta = {
      id: newId,
      title: originalMeta.title,
      createdAt: Date.now(),
      activeModelId: null,
    };

    // 存储到 IndexedDB
    await saveMeta(newMeta);
    await saveConversationTree(newId, tree);

    // 更新 Store
    const { useTreeStore } = await import('../store/useTreeStore');
    const store = useTreeStore.getState();
    const newMetaMap = { ...store.meta, [newId]: newMeta };
    const newTrees = { ...store.trees, [newId]: tree };

    // 如果没有活跃对话，自动切换到新对话；否则仅添加
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
    return true;
  } catch (err) {
    console.error('导入解析失败:', err);
    return false;
  }
}

/**
 * 移动端导出到剪贴板
 */
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