import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ConversationTree, ConversationMeta, AppData } from '../types';
import {
  createTree,
  appendToCurrentBranch,
  createBranchFrom,
  getPathTo,
} from '../lib/tree';
import { loadAppData, saveAppData } from '../lib/storage';

interface TreeState {
  // 多对话数据
  activeId: string;
  meta: Record<string, ConversationMeta>;
  trees: Record<string, ConversationTree>;
  // 当前活跃树的快照（保持向后兼容）
  tree: ConversationTree;

  // UI 状态
  viewMode: 'chat' | 'map';
  selectedNodeId: string | null;

  // 对话操作
  createConversation: (title?: string) => string;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => void;

  // 树操作（针对当前对话）
  sendMessage: (content: string) => void;
  editMessage: (nodeId: string, newContent: string) => void;
  switchToNode: (nodeId: string) => void;
  setTree: (tree: ConversationTree) => void;

  // 视图与选中
  setViewMode: (mode: 'chat' | 'map') => void;
  selectNode: (id: string | null) => void;

  // 持久化
  initFromStorage: () => void;
  persist: () => void;
}

function createNewMeta(title?: string): ConversationMeta {
  return {
    id: uuidv4(),
    title: title || '新对话',
    createdAt: Date.now(),
    activeModelId: null,
  };
}

// 保存当前状态到 localStorage（内部辅助）
function persistState(state: TreeState) {
  const appData: AppData = {
    activeId: state.activeId,
    meta: state.meta,
    trees: state.trees,
  };
  saveAppData(appData);
}

export const useTreeStore = create<TreeState>((set, get) => ({
  activeId: '',
  meta: {},
  trees: {},
  tree: createTree(), // 临时，将被初始化覆盖

  viewMode: 'chat',
  selectedNodeId: null,

  createConversation: (title?: string) => {
    const state = get();
    const newMeta = createNewMeta(title);
    const newTree = createTree();
    const newTrees = { ...state.trees, [newMeta.id]: newTree };
    const newMetaMap = { ...state.meta, [newMeta.id]: newMeta };
    set({
      activeId: newMeta.id,
      meta: newMetaMap,
      trees: newTrees,
      tree: newTree,
    });
    persistState(get());
    return newMeta.id;
  },

  switchConversation: (id) => {
    const state = get();
    if (!state.trees[id]) return;
    set({
      activeId: id,
      tree: state.trees[id],
    });
    // 不立即持久化，减少写入
  },

  deleteConversation: (id) => {
    const state = get();
    const newTrees = { ...state.trees };
    delete newTrees[id];
    const newMeta = { ...state.meta };
    delete newMeta[id];
    let newActiveId = state.activeId;
    let newTree = state.tree;

    // 如果删除的是当前活跃对话，需要切换
    if (newActiveId === id) {
      const remainingIds = Object.keys(newTrees);
      if (remainingIds.length > 0) {
        newActiveId = remainingIds[0];
        newTree = newTrees[newActiveId];
      } else {
        // 没有任何对话了，创建默认对话
        const meta = createNewMeta();
        const tree = createTree();
        set({
          activeId: meta.id,
          meta: { [meta.id]: meta },
          trees: { [meta.id]: tree },
          tree,
        });
        persistState(get());
        return;
      }
    }

    set({
      activeId: newActiveId,
      meta: newMeta,
      trees: newTrees,
      tree: newTree,
    });
    persistState(get());
  },

  sendMessage: (content) => {
    const state = get();
    const newTree = appendToCurrentBranch(state.tree, 'user', content);
    const newTrees = { ...state.trees, [state.activeId]: newTree };
    set({ trees: newTrees, tree: newTree });
    persistState({ ...state, trees: newTrees, tree: newTree });
  },

  editMessage: (nodeId, newContent) => {
    const state = get();
    const newTree = createBranchFrom(state.tree, nodeId, newContent);
    const newTrees = { ...state.trees, [state.activeId]: newTree };
    set({ trees: newTrees, tree: newTree });
    persistState({ ...state, trees: newTrees, tree: newTree });
  },

  switchToNode: (nodeId) => {
    const state = get();
    const path = getPathTo(state.tree, nodeId);
    const newTree = { ...state.tree, currentPath: path };
    const newTrees = { ...state.trees, [state.activeId]: newTree };
    set({
      trees: newTrees,
      tree: newTree,
      viewMode: 'chat',
      selectedNodeId: null,
    });
    persistState({ ...state, trees: newTrees, tree: newTree });
  },

  setTree: (tree) => {
    const state = get();
    const newTrees = { ...state.trees, [state.activeId]: tree };
    set({ trees: newTrees, tree });
    persistState({ ...state, trees: newTrees, tree });
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  selectNode: (id) => set({ selectedNodeId: id }),

  initFromStorage: () => {
    const saved = loadAppData();
    if (saved && saved.trees && saved.activeId && saved.trees[saved.activeId]) {
      set({
        activeId: saved.activeId,
        meta: saved.meta ?? {},
        trees: saved.trees,
        tree: saved.trees[saved.activeId],
      });
    } else {
      // 首次使用或数据损坏，创建默认对话
      get().createConversation();
    }
  },

  persist: () => {
    persistState(get());
  },
}));