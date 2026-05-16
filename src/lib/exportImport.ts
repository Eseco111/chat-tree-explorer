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

/** 桌面端文件导入（创建新对话） */
export function importConversation(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const raw = e.target?.result;
        if (typeof raw !== 'string') throw new Error('无法读取文件内容');
        const json = JSON.parse(raw);

        // 基本格式验证
        if (!json.meta || !json.tree) {
          throw new Error('文件格式不正确，需要包含 meta 和 tree');
        }
        const originalMeta = json.meta as ConversationMeta;
        const tree = json.tree as ConversationTree;

        // 验证必要字段
        if (!originalMeta.title || !tree.rootId || !tree.nodes) {
          throw new Error('数据缺少必要字段');
        }

        // 创建新对话 ID
        const newId = uuidv4();
        const newMeta: ConversationMeta = {
          id: newId,
          title: originalMeta.title,
          createdAt: Date.now(),
          activeModelId: null,
        };

        // 存入 IndexedDB
        await saveMeta(newMeta);
        await saveConversationTree(newId, tree);

        // 动态导入 store，避免循环依赖
        const { useTreeStore } = await import('../store/useTreeStore');
        const storeState = useTreeStore.getState();

        // 更新 store 中的 meta 和 trees 缓存
        const newMetaMap = { ...storeState.meta, [newId]: newMeta };
        const newTrees = { ...storeState.trees, [newId]: tree };

        // 如果当前没有活跃对话，自动切换到新对话
        if (!storeState.activeId) {
          useTreeStore.setState({
            meta: newMetaMap,
            trees: newTrees,
            activeId: newId,
            tree: tree,
          });
        } else {
          useTreeStore.setState({
            meta: newMetaMap,
            trees: newTrees,
          });
        }

        resolve(true);
      } catch (err) {
        console.error('导入失败:', err);
        resolve(false);
      }
    };
    reader.onerror = () => resolve(false);
    reader.readAsText(file);
  });
}

/** 移动端粘贴导入（创建新对话） */
export async function importConversationFromText(text: string): Promise<boolean> {
  try {
    const json = JSON.parse(text);
    if (!json.meta || !json.tree) throw new Error('格式错误');
    const originalMeta = json.meta as ConversationMeta;
    const tree = json.tree as ConversationTree;

    // 基础数据校验
    if (!originalMeta.title || !tree.rootId || !tree.nodes) throw new Error('数据不完整');

    // 创建新对话 ID
    const newId = uuidv4();
    const newMeta: ConversationMeta = {
      id: newId,
      title: originalMeta.title,
      createdAt: Date.now(),
      activeModelId: null,
    };

    await saveMeta(newMeta);
    await saveConversationTree(newId, tree);

    const { useTreeStore } = await import('../store/useTreeStore');
    const storeState = useTreeStore.getState();
    const newMetaMap = { ...storeState.meta, [newId]: newMeta };
    const newTrees = { ...storeState.trees, [newId]: tree };

    if (!storeState.activeId) {
      useTreeStore.setState({
        meta: newMetaMap,
        trees: newTrees,
        activeId: newId,
        tree,
      });
    } else {
      useTreeStore.setState({ meta: newMetaMap, trees: newTrees });
    }
    return true;
  } catch (err) {
    console.error('导入失败', err);
    alert('导入失败，请检查 JSON 格式是否正确');
    return false;
  }
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