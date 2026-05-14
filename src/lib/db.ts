import Dexie, { type Table } from 'dexie';
import type { ConversationTree, ConversationMeta, ModelConfig, AppData } from '../types';

// 数据库类
class ChatDB extends Dexie {
  conversations!: Table<{ id: string; tree: ConversationTree }>;
  meta!: Table<ConversationMeta>;
  models!: Table<ModelConfig>;
  appState!: Table<{ key: string; value: unknown }>; // 存放 activeId, activeModelId 等

  constructor() {
    super('ChatTreeDB');
    this.version(1).stores({
      conversations: 'id',     // id 为主键
      meta: 'id',
      models: 'id',
      appState: 'key',
    });
  }
}

const db = new ChatDB();

// ---------- 对话树操作 ----------
export async function saveConversationTree(id: string, tree: ConversationTree) {
  await db.conversations.put({ id, tree });
}

export async function loadConversationTree(id: string): Promise<ConversationTree | undefined> {
  const entry = await db.conversations.get(id);
  return entry?.tree;
}

export async function deleteConversationTree(id: string) {
  await db.conversations.delete(id);
}

// ---------- 元信息操作 ----------
export async function saveMeta(meta: ConversationMeta) {
  await db.meta.put(meta);
}

export async function loadAllMeta(): Promise<ConversationMeta[]> {
  return db.meta.toArray();
}

export async function deleteMeta(id: string) {
  await db.meta.delete(id);
}

// ---------- 模型操作 ----------
export async function saveModel(model: ModelConfig) {
  await db.models.put(model);
}

export async function loadAllModels(): Promise<ModelConfig[]> {
  return db.models.toArray();
}

export async function deleteModel(id: string) {
  await db.models.delete(id);
}

// ---------- 应用状态（activeId, activeModelId） ----------
export async function saveAppState(key: string, value: unknown) {
  await db.appState.put({ key, value });
}

export async function loadAppState(): Promise<Record<string, unknown>> {
  const entries = await db.appState.toArray();
  const state: Record<string, unknown> = {};
  entries.forEach((e) => { state[e.key] = e.value; });
  return state;
}

// ---------- 从 localStorage 迁移（仅执行一次） ----------
export async function migrateFromLocalStorage() {
  const oldData = localStorage.getItem('chat-app-data');
  if (!oldData) return false; // 没有旧数据

  try {
    const parsed: AppData = JSON.parse(oldData);
    // 迁移对话树
    for (const id of Object.keys(parsed.trees)) {
      await saveConversationTree(id, parsed.trees[id]);
    }
    // 迁移元信息
    for (const id of Object.keys(parsed.meta)) {
      await saveMeta(parsed.meta[id]);
    }
    // 迁移模型
    for (const id of Object.keys(parsed.models)) {
      await saveModel(parsed.models[id]);
    }
    // 迁移应用状态
    await saveAppState('activeId', parsed.activeId);
    await saveAppState('activeModelId', parsed.activeModelId);
    // 迁移完成后删除旧数据
    localStorage.removeItem('chat-app-data');
    localStorage.removeItem('deepseek-api-key');
    return true;
  } catch (e) {
    console.error('数据迁移失败', e);
    return false;
  }
}