import { v4 as uuidv4 } from 'uuid';
import type { ConversationTree, MessageNode, Role } from '../types';

/**
 * 创建一个全新的对话树
 */
export function createTree(): ConversationTree {
  const rootId = uuidv4();
  const rootNode: MessageNode = {
    id: rootId,
    parentId: null,
    role: 'assistant',   // 占位角色，不影响对话
    content: '',          // 空内容
    childrenIds: [],
    timestamp: Date.now(),
  };
  return {
    rootId,
    nodes: { [rootId]: rootNode },
    currentPath: [rootId],
  };
}

/**
 * 向树中添加一个节点，并更新父节点的 childrenIds
 */
export function addNode(
  tree: ConversationTree,
  parentId: string,
  role: Role,
  content: string
): ConversationTree {
  const id = uuidv4();
  const node: MessageNode = {
    id,
    parentId,
    role,
    content,
    childrenIds: [],
    timestamp: Date.now(),
  };

  const newNodes: Record<string, MessageNode> = { ...tree.nodes, [id]: node };

  // 如果父节点存在，则更新其 childrenIds
  if (parentId && tree.nodes[parentId]) {
    const parent = tree.nodes[parentId];
    newNodes[parentId] = {
      ...parent,
      childrenIds: [...parent.childrenIds, id],
    };
  }

  return {
    ...tree,
    nodes: newNodes,
  };
}

/**
 * 在当前分支末尾追加新节点（用于正常流式对话）
 */
export function appendToCurrentBranch(
  tree: ConversationTree,
  role: Role,
  content: string
): ConversationTree {
  const parentId = tree.currentPath[tree.currentPath.length - 1] || tree.rootId;
  const newTree = addNode(tree, parentId, role, content);
  const parent = newTree.nodes[parentId];
  const newNodeId = parent.childrenIds[parent.childrenIds.length - 1];
  return {
    ...newTree,
    currentPath: [...newTree.currentPath, newNodeId],
  };
}

/**
 * 在指定节点下创建新分支（插中编辑的核心操作）
 */
export function createBranchFrom(
  tree: ConversationTree,
  nodeId: string,
  newUserContent: string
): ConversationTree {
  const newTree = addNode(tree, nodeId, 'user', newUserContent);
  const newNodeId = newTree.nodes[nodeId].childrenIds.slice(-1)[0];
  return {
    ...newTree,
    currentPath: getPathTo(newTree, newNodeId),
  };
}

/**
 * 获取从根节点到指定节点的 ID 路径（数组）
 */
export function getPathTo(tree: ConversationTree, nodeId: string): string[] {
  const path: string[] = [];
  let currentId: string | null = nodeId;
  while (currentId) {
    path.unshift(currentId);
    const node: MessageNode | undefined = tree.nodes[currentId];  // 显式声明类型
    currentId = node?.parentId ?? null;
  }
  return path;
}

/**
 * 根据当前路径构建发送给 LLM 的 messages 数组
 */
export function buildMessages(tree: ConversationTree): { role: Role; content: string }[] {
  return tree.currentPath
    .map(id => tree.nodes[id])
    .filter(Boolean)
    .map(node => ({ role: node.role, content: node.content }));
}