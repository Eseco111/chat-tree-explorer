import type { ConversationMeta, ConversationTree } from '../types';
import { loadConversationTree, saveConversationTree, saveMeta } from './db';

/**
 * 导出单个对话为 JSON 文件并触发浏览器下载
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
  // 文件名：对话标题-日期.json
  a.download = `${meta.title}-${new Date(meta.createdAt).toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 导入 JSON 文件并添加到 IndexedDB 和 Store
 * @returns 是否成功
 */
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
        const meta = json.meta as ConversationMeta;
        const tree = json.tree as ConversationTree;

        // 可选：验证必要字段
        if (!meta.id || !meta.title || !tree.rootId || !tree.nodes) {
          throw new Error('数据缺少必要字段');
        }

        // 存入 IndexedDB
        await saveMeta(meta);
        await saveConversationTree(meta.id, tree);

        // 动态导入 store，避免循环依赖
        const { useTreeStore } = await import('../store/useTreeStore');
        const storeState = useTreeStore.getState();

        // 更新 store 中的 meta 和 trees 缓存
        const newMeta = { ...storeState.meta, [meta.id]: meta };
        const newTrees = { ...storeState.trees, [meta.id]: tree };

        // 如果当前没有活跃对话，可以自动切换到导入的对话（可选）
        if (!storeState.activeId) {
          useTreeStore.setState({
            meta: newMeta,
            trees: newTrees,
            activeId: meta.id,
            tree: tree,
          });
        } else {
          useTreeStore.setState({
            meta: newMeta,
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

// 导出到剪贴板（移动端使用）
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

// 从文本导入（移动端粘贴使用）
export async function importConversationFromText(text: string): Promise<boolean> {
  try {
    const json = JSON.parse(text);
    if (!json.meta || !json.tree) throw new Error('格式错误');
    const meta = json.meta as ConversationMeta;
    const tree = json.tree as ConversationTree;

    // 基础数据校验
    if (!meta.id || !meta.title || !tree.rootId || !tree.nodes) throw new Error('数据不完整');

    await saveMeta(meta);
    await saveConversationTree(meta.id, tree);

    const { useTreeStore } = await import('../store/useTreeStore');
    const storeState = useTreeStore.getState();
    const newMeta = { ...storeState.meta, [meta.id]: meta };
    const newTrees = { ...storeState.trees, [meta.id]: tree };

    if (!storeState.activeId) {
      useTreeStore.setState({
        meta: newMeta,
        trees: newTrees,
        activeId: meta.id,
        tree,
      });
    } else {
      useTreeStore.setState({ meta: newMeta, trees: newTrees });
    }
    return true;
  } catch (err) {
    console.error('导入失败', err);
    return false;
  }
}