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
export interface AppData {
  activeId: string;
  meta: Record<string, ConversationMeta>;
  // 树数据按需加载时不在此处存储所有节点，但第一阶段先全量存储
  trees: Record<string, ConversationTree>;
}