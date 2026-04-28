import type { ConversationTree } from '../types';

const STORAGE_KEY = 'chat-tree-data';

export function saveTree(tree: ConversationTree): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
  } catch (e) {
    console.error('保存对话树失败:', e);
  }
}

export function loadTree(): ConversationTree | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConversationTree) : null;
  } catch (e) {
    console.error('加载对话树失败:', e);
    return null;
  }
}

export function clearTree(): void {
  localStorage.removeItem(STORAGE_KEY);
}