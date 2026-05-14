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
  trees: Record<string, ConversationTree>;  // 缓存已加载的对话树
  tree: ConversationTree;

  models: Record<string, ModelConfig>;
  activeModelId: string;

  viewMode: 'chat' | 'map';
  selectedNodeId: string | null;

  createConversation: (title?: string) => string;
  switchConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;

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
  persist: () => void;  // 保留兼容，但通常不再需要手动调用
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

  // ---------- 对话操作 ----------
  createConversation: (title?: string) => {
    const state = get();
    const newMeta = createNewMeta(title);
    const newTree = createTree();
    // 更新缓存
    const newTrees = { ...state.trees, [newMeta.id]: newTree };
    const newMetaMap = { ...state.meta, [newMeta.id]: newMeta };
    set({
      activeId: newMeta.id,
      meta: newMetaMap,
      trees: newTrees,
      tree: newTree,
    });
    // 异步持久化（不等待）
    saveConversationTree(newMeta.id, newTree);
    saveMeta(newMeta);
    saveAppState('activeId', newMeta.id);
    return newMeta.id;
  },

  switchConversation: async (id) => {
    const state = get();
    // 如果已在缓存中，直接使用
    if (state.trees[id]) {
      set({ activeId: id, tree: state.trees[id] });
      await saveAppState('activeId', id);
      return;
    }
    // 从 IndexedDB 加载
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
        // 加载目标对话树
        newTree = (await loadConversationTree(newActiveId)) || createTree();
        if (newTree) newTrees[newActiveId] = newTree;
      } else {
        // 没有对话了，创建默认
        const meta = createNewMeta();
        const tree = createTree();
        newTrees[meta.id] = tree;
        newMeta[meta.id] = meta;
        newActiveId = meta.id;
        newTree = tree;
        // 持久化新对话
        saveConversationTree(meta.id, tree);
        saveMeta(meta);
      }
    }

    set({
      activeId: newActiveId,
      meta: newMeta,
      trees: newTrees,
      tree: newTree,
    });
    // 异步删除 IndexedDB 中的旧对话
    deleteConversationTree(id);
    deleteMeta(id);
    await saveAppState('activeId', newActiveId);
  },

  sendMessage: (content) => {
    const state = get();
    const newTree = appendToCurrentBranch(state.tree, 'user', content);
    const newTrees = { ...state.trees, [state.activeId]: newTree };

    const currentMeta = state.meta[state.activeId];
    // 自动更新对话标题（如果是第一条消息）
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
        // 持久化
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

  // ---------- 模型操作 ----------
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

  // ---------- 初始化 ----------
  initFromStorage: async () => {
    // 1. 迁移旧 localStorage 数据（仅一次）
    await migrateFromLocalStorage();

    // 2. 从 IndexedDB 加载元信息
    const allMeta = await loadAllMeta();
    const metaMap: Record<string, ConversationMeta> = {};
    allMeta.forEach(m => metaMap[m.id] = m);

    // 3. 加载模型配置
    const allModels = await loadAllModels();
    const modelsMap: Record<string, ModelConfig> = {};
    allModels.forEach(m => modelsMap[m.id] = m);

    // 4. 加载应用状态
    const appState = await loadAppState();
    const activeId: string = (appState.activeId as string) || '';
    const activeModelId: string = (appState.activeModelId as string) || '';

    // 5. 加载当前活跃对话树（如果存在）
    let tree: ConversationTree;
    const trees: Record<string, ConversationTree> = {};

    if (activeId && metaMap[activeId]) {
      const savedTree = await loadConversationTree(activeId);
      if (savedTree) {
        tree = savedTree;
        trees[activeId] = savedTree;
      } else {
        // 如果树丢失，创建新树并保存
        tree = createTree();
        trees[activeId] = tree;
        saveConversationTree(activeId, tree);
      }
    } else {
      // 没有活跃对话或元信息损坏，创建一个默认对话
      const meta = createNewMeta();
      metaMap[meta.id] = meta;
      tree = createTree();
      trees[meta.id] = tree;
      // 持久化新对话
      saveConversationTree(meta.id, tree);
      saveMeta(meta);
      // 更新应用状态
      saveAppState('activeId', meta.id);
      set({
        activeId: meta.id,
        meta: metaMap,
        models: modelsMap,
        activeModelId,
        trees,
        tree,
      });
      return;
    }

    // 设置最终状态
    set({
      activeId,
      meta: metaMap,
      trees,
      tree,
      models: modelsMap,
      activeModelId,
    });
  },

  persist: () => {
    // 不再需要全量持久化，保留空实现以防旧代码调用
  },
}));