// 消息角色
export type Role = 'user' | 'assistant';

// 单个对话节点
export interface MessageNode {
  id: string;                     // 唯一ID
  parentId: string | null;        // 父节点ID，根节点为 null
  role: Role;                     // 角色
  content: string;                // 消息内容
  childrenIds: string[];          // 子节点ID列表（支持分支，按创建顺序）
  timestamp: number;              // 创建时间戳
}

// 整个对话树
export interface ConversationTree {
  rootId: string;                 // 起始节点（根节点通常不是实际消息，可作逻辑起点）
  nodes: Record<string, MessageNode>;  // 所有节点映射
  currentPath: string[];          // 当前活动路径的节点ID序列，从根到当前叶子
}

// 对话元信息
export interface ConversationMeta {
  id: string;
  title: string;
  createdAt: number;
  activeModelId: string | null; // 该对话最后使用的模型ID，便于恢复
}

// 应用整体持久化格式
export interface ModelConfig {
  id: string;            // 唯一标识，如 'deepseek-default'
  name: string;          // 显示名称，如 'DeepSeek V4 Flash'
  provider: 'deepseek' | 'openai' | 'custom';
  baseURL: string;
  apiKey: string;        // 注意：明文存储于本地，仅供个人工具
  model: string;         // 模型名，如 'deepseek-v4-flash'
  isDefault?: boolean;   // 是否预设默认（不可删除）
}

// 扩展 AppData，增加模型相关字段
export interface AppData {
  activeId: string;
  meta: Record<string, ConversationMeta>;
  trees: Record<string, ConversationTree>;
  models: Record<string, ModelConfig>;       // 新增
  activeModelId: string;                     // 新增
}