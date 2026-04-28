import { create } from 'zustand';
import type { ConversationTree } from '../types';
import {
  createTree,
  appendToCurrentBranch,
  createBranchFrom,   // 确保已导入
  getPathTo,
} from '../lib/tree';
import { saveTree, loadTree } from '../lib/storage';

interface TreeState {
  tree: ConversationTree;
  viewMode: 'chat' | 'map';
  selectedNodeId: string | null;

  setViewMode: (mode: 'chat' | 'map') => void;
  selectNode: (id: string | null) => void;
  sendMessage: (content: string) => void;
  editMessage: (nodeId: string, newContent: string) => void;
  switchToNode: (nodeId: string) => void;
  setTree: (tree: ConversationTree) => void;
  initFromStorage: () => void;
}

export const useTreeStore = create<TreeState>((set, get) => ({
  tree: createTree(),
  viewMode: 'chat',
  selectedNodeId: null,

  setViewMode: (mode) => set({ viewMode: mode }),
  selectNode: (id) => set({ selectedNodeId: id }),

  sendMessage: (content) => {
    const state = get();
    const newTree = appendToCurrentBranch(state.tree, 'user', content);
    set({ tree: newTree });
    saveTree(newTree);
  },

  editMessage: (nodeId, newContent) => {
    const { tree } = get();
    const node = tree.nodes[nodeId];
    if (!node || node.role !== 'user') {
      console.warn('只能编辑用户消息');
      return;
    }
    const newTree = createBranchFrom(tree, nodeId, newContent);
    set({ tree: newTree });
    saveTree(newTree);
  },

  switchToNode: (nodeId) => {
    const { tree } = get();
    const path = getPathTo(tree, nodeId);
    set({
      tree: { ...tree, currentPath: path },
      viewMode: 'chat',
      selectedNodeId: null,
    });
  },

  setTree: (tree) => {
    set({ tree });
    saveTree(tree);
  },

  initFromStorage: () => {
    const saved = loadTree();
    if (saved && saved.rootId && saved.nodes) {
      set({ tree: saved });
    }
  },
}));