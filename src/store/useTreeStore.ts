import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ConversationTree, ConversationMeta, AppData, ModelConfig } from '../types';
import {
  createTree,
  appendToCurrentBranch,
  createBranchFrom,
  getPathTo,
} from '../lib/tree';
import { loadAppData, saveAppData } from '../lib/storage';

interface TreeState {
  activeId: string;
  meta: Record<string, ConversationMeta>;
  trees: Record<string, ConversationTree>;
  tree: ConversationTree;

  models: Record<string, ModelConfig>;
  activeModelId: string;

  viewMode: 'chat' | 'map';
  selectedNodeId: string | null;

  createConversation: (title?: string) => string;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => void;

  sendMessage: (content: string) => void;
  editMessage: (nodeId: string, newContent: string) => void;
  switchToNode: (nodeId: string) => void;
  setTree: (tree: ConversationTree) => void;

  setViewMode: (mode: 'chat' | 'map') => void;
  selectNode: (id: string | null) => void;

  addModel: (config: ModelConfig) => void;
  removeModel: (id: string) => void;
  setActiveModel: (id: string) => void;
  updateModel: (id: string, patch: Partial<ModelConfig>) => void;

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

function persistState(state: TreeState) {
  const appData: AppData = {
    activeId: state.activeId,
    meta: state.meta,
    trees: state.trees,
    models: state.models,
    activeModelId: state.activeModelId,
  };
  saveAppData(appData);
}

export const useTreeStore = create<TreeState>((set, get) => ({
  activeId: '',
  meta: {},
  trees: {},
  tree: createTree(),

  models: {},
  activeModelId: '',            // 初始为空，无默认模型

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
    set({ activeId: id, tree: state.trees[id] });
    get().persist();
  },

  deleteConversation: (id) => {
    const state = get();
    const newTrees = { ...state.trees };
    delete newTrees[id];
    const newMeta = { ...state.meta };
    delete newMeta[id];
    let newActiveId = state.activeId;
    let newTree = state.tree;

    if (newActiveId === id) {
      const remainingIds = Object.keys(newTrees);
      if (remainingIds.length > 0) {
        newActiveId = remainingIds[0];
        newTree = newTrees[newActiveId];
      } else {
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

    const currentMeta = state.meta[state.activeId];
    if (currentMeta && currentMeta.title === '新对话') {
      const userMessageCount = Object.values(newTree.nodes).filter(
        (n) => n.role === 'user'
      ).length;
      if (userMessageCount <= 1) {
        const newMeta = {
          ...state.meta,
          [state.activeId]: {
            ...currentMeta,
            title: content.slice(0, 20) + (content.length > 20 ? '...' : ''),
          },
        };
        set({ trees: newTrees, tree: newTree, meta: newMeta });
        persistState({ ...state, trees: newTrees, tree: newTree, meta: newMeta });
        return;
      }
    }

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

  // ---------- 模型操作 ----------
  addModel: (config) => {
    const state = get();
    const newModels = { ...state.models, [config.id]: config };
    set({ models: newModels });
    persistState(get());
  },

  removeModel: (id) => {
    const state = get();
    const newModels = { ...state.models };
    delete newModels[id];
    let newActive = state.activeModelId;
    if (newActive === id) {
      const firstId = Object.keys(newModels)[0];
      newActive = firstId || '';           // 无模型时置空
    }
    set({ models: newModels, activeModelId: newActive });
    persistState(get());
  },

  setActiveModel: (id) => {
    if (id === '' || get().models[id]) {
      set({ activeModelId: id });
      get().persist();
    }
  },

  updateModel: (id, patch) => {
    const state = get();
    if (!state.models[id]) return;
    const newModels = {
      ...state.models,
      [id]: { ...state.models[id], ...patch },
    };
    set({ models: newModels });
    persistState(get());
  },

  // ---------- 初始化 ----------
  initFromStorage: () => {
    const saved = loadAppData();
    if (saved && saved.trees && saved.activeId && saved.trees[saved.activeId]) {
      set({
        activeId: saved.activeId,
        meta: saved.meta ?? {},
        trees: saved.trees,
        tree: saved.trees[saved.activeId],
        models: saved.models ?? {},
        activeModelId: saved.activeModelId ?? '',
      });
    } else {
      // 仅创建默认对话，不自动创建模型
      get().createConversation();
    }
  },

  persist: () => {
    persistState(get());
  },
}));