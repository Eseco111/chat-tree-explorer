import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ConversationTree, ConversationMeta, ModelConfig } from '../types';
import {
  createTree,
  appendToCurrentBranch,
  createBranchFrom,
  getPathTo,
} from '../lib/tree';
import {
  saveConversationTree,
  loadConversationTree,
  deleteConversationTree,
  saveMeta,
  loadAllMeta,
  deleteMeta,
  saveModel as saveModelDB,
  loadAllModels,
  deleteModel as deleteModelDB,
  saveAppState,
  loadAppState,
  migrateFromLocalStorage,
} from '../lib/db';

interface TreeState {
  activeId: string;
  meta: Record<string, ConversationMeta>;
  trees: Record<string, ConversationTree>;
  tree: ConversationTree;

  models: Record<string, ModelConfig>;
  activeModelId: string;

  viewMode: 'chat' | 'map';
  selectedNodeId: string | null;

  // 侧边栏折叠状态
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  createConversation: (title?: string) => string;
  switchConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, newTitle: string) => void;

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

  initFromStorage: () => Promise<void>;
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

export const useTreeStore = create<TreeState>((set, get) => ({
  activeId: '',
  meta: {},
  trees: {},
  tree: createTree(),

  models: {},
  activeModelId: '',

  viewMode: 'chat',
  selectedNodeId: null,

  sidebarCollapsed: false, // 初始展开

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
    saveConversationTree(newMeta.id, newTree);
    saveMeta(newMeta);
    saveAppState('activeId', newMeta.id);
    return newMeta.id;
  },

  switchConversation: async (id) => {
    const state = get();
    if (state.trees[id]) {
      set({ activeId: id, tree: state.trees[id] });
      await saveAppState('activeId', id);
      return;
    }
    const tree = await loadConversationTree(id);
    if (tree) {
      const newTrees = { ...state.trees, [id]: tree };
      set({ activeId: id, tree, trees: newTrees });
      await saveAppState('activeId', id);
    } else {
      console.warn(`对话 ${id} 不存在于 IndexedDB`);
    }
  },

  deleteConversation: async (id) => {
    const state = get();
    const newTrees = { ...state.trees };
    delete newTrees[id];
    const newMeta = { ...state.meta };
    delete newMeta[id];
    let newActiveId = state.activeId;
    let newTree = state.tree;

    if (newActiveId === id) {
      const remainingIds = Object.keys(newMeta);
      if (remainingIds.length > 0) {
        newActiveId = remainingIds[0];
        newTree = newTrees[newActiveId] || (await loadConversationTree(newActiveId)) || createTree();
        if (!newTrees[newActiveId]) newTrees[newActiveId] = newTree;
      } else {
        // 空状态
        newActiveId = '';
        newTree = createTree(); // 占位
      }
    }

    set({
      activeId: newActiveId,
      meta: newMeta,
      trees: newTrees,
      tree: newTree,
    });
    deleteConversationTree(id);
    deleteMeta(id);
    await saveAppState('activeId', newActiveId);
  },

  renameConversation: (id: string, newTitle: string) => {
    const state = get();
    if (!state.meta[id]) return;
    const updatedMeta = { ...state.meta[id], title: newTitle };
    const newMetaMap = { ...state.meta, [id]: updatedMeta };
    set({ meta: newMetaMap });
    saveMeta(updatedMeta);
  },

  sendMessage: (content) => {
    const state = get();
    if (!state.activeId) return;
    const newTree = appendToCurrentBranch(state.tree, 'user', content);
    const newTrees = { ...state.trees, [state.activeId]: newTree };

    const currentMeta = state.meta[state.activeId];
    if (currentMeta && currentMeta.title === '新对话') {
      const userMessageCount = Object.values(newTree.nodes).filter(
        (n) => n.role === 'user'
      ).length;
      if (userMessageCount <= 1) {
        const newMetaItem = {
          ...currentMeta,
          title: content.slice(0, 20) + (content.length > 20 ? '...' : ''),
        };
        const newMeta = {
          ...state.meta,
          [state.activeId]: newMetaItem,
        };
        set({ trees: newTrees, tree: newTree, meta: newMeta });
        saveConversationTree(state.activeId, newTree);
        saveMeta(newMetaItem);
        return;
      }
    }

    set({ trees: newTrees, tree: newTree });
    saveConversationTree(state.activeId, newTree);
  },

  editMessage: (nodeId, newContent) => {
    const state = get();
    const newTree = createBranchFrom(state.tree, nodeId, newContent);
    const newTrees = { ...state.trees, [state.activeId]: newTree };
    set({ trees: newTrees, tree: newTree });
    saveConversationTree(state.activeId, newTree);
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
    saveConversationTree(state.activeId, newTree);
  },

  setTree: (tree) => {
    const state = get();
    const newTrees = { ...state.trees, [state.activeId]: tree };
    set({ trees: newTrees, tree });
    saveConversationTree(state.activeId, tree);
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  selectNode: (id) => set({ selectedNodeId: id }),

  // 侧边栏折叠切换
  toggleSidebar: () => {
    const newCollapsed = !get().sidebarCollapsed;
    set({ sidebarCollapsed: newCollapsed });
    saveAppState('sidebarCollapsed', newCollapsed);
  },

  addModel: (config) => {
    const state = get();
    const newModels = { ...state.models, [config.id]: config };
    set({ models: newModels });
    saveModelDB(config);
  },

  removeModel: (id) => {
    const state = get();
    const newModels = { ...state.models };
    delete newModels[id];
    let newActive = state.activeModelId;
    if (newActive === id) {
      const firstId = Object.keys(newModels)[0];
      newActive = firstId || '';
    }
    set({ models: newModels, activeModelId: newActive });
    deleteModelDB(id);
    saveAppState('activeModelId', newActive);
  },

  setActiveModel: (id) => {
    if (id === '' || get().models[id]) {
      set({ activeModelId: id });
      saveAppState('activeModelId', id);
    }
  },

  updateModel: (id, patch) => {
    const state = get();
    if (!state.models[id]) return;
    const newModel = { ...state.models[id], ...patch };
    const newModels = { ...state.models, [id]: newModel };
    set({ models: newModels });
    saveModelDB(newModel);
  },

  initFromStorage: async () => {
    await migrateFromLocalStorage();

    const allMeta = await loadAllMeta();
    const metaMap: Record<string, ConversationMeta> = {};
    allMeta.forEach(m => metaMap[m.id] = m);

    const allModels = await loadAllModels();
    const modelsMap: Record<string, ModelConfig> = {};
    allModels.forEach(m => modelsMap[m.id] = m);

    const appState = await loadAppState();
    const activeId: string = (appState.activeId as string) || '';
    const activeModelId: string = (appState.activeModelId as string) || '';
    const sidebarCollapsed: boolean = !!appState.sidebarCollapsed; // 加载折叠状态

    let tree: ConversationTree;
    const trees: Record<string, ConversationTree> = {};

    if (activeId && metaMap[activeId]) {
      const savedTree = await loadConversationTree(activeId);
      if (savedTree) {
        tree = savedTree;
        trees[activeId] = savedTree;
      } else {
        tree = createTree();
        trees[activeId] = tree;
        saveConversationTree(activeId, tree);
      }
    } else {
      const meta = createNewMeta();
      metaMap[meta.id] = meta;
      tree = createTree();
      trees[meta.id] = tree;
      saveConversationTree(meta.id, tree);
      saveMeta(meta);
      saveAppState('activeId', meta.id);
      set({
        activeId: meta.id,
        meta: metaMap,
        models: modelsMap,
        activeModelId,
        trees,
        tree,
        sidebarCollapsed, // 保持默认 false
      });
      return;
    }

    set({
      activeId,
      meta: metaMap,
      trees,
      tree,
      models: modelsMap,
      activeModelId,
      sidebarCollapsed, // 设置折叠状态
    });
  },

  persist: () => {},
}));