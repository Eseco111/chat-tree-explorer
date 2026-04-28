import dagre from 'dagre';
import type { Node, Edge } from 'reactflow';
import type { ConversationTree } from '../types';
import { MarkerType } from 'reactflow';
/**
 * 将对话树转换为 React Flow 的节点和边
 * @param tree 当前对话树
 * @param currentPathIds 当前活动路径的节点 ID 集合（用于高亮）
 */
export function convertToFlow(
  tree: ConversationTree,
  currentPathIds: string[]
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 20, ranksep: 50 });

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // 1. 遍历所有节点，创建基础节点（跳过占位根节点，但保留其子节点连接）
  Object.values(tree.nodes).forEach((node) => {
    // 跳过内容为空的根节点（示例中根节点 role 为 assistant，content 为空）
    if (node.content === '' && node.parentId === null) return;

    const isOnPath = currentPathIds.includes(node.id);
    nodes.push({
      id: node.id,
      type: 'customNode',                // 自定义节点类型
      position: { x: 0, y: 0 },          // dagre 会重新计算
      data: {
        id: node.id,
        role: node.role,
        content: node.content,
        timestamp: node.timestamp,
        isCurrentPath: isOnPath,
      },
    });

    // 设置节点尺寸用于 dagre 布局
    g.setNode(node.id, { width: 40, height: 40 });
  });

  // 2. 创建边
  Object.values(tree.nodes).forEach((node) => {
    if (node.parentId && tree.nodes[node.parentId]) {
      // 如果父节点是占位根节点，则跳过该边（避免出现悬空边）
      const parent = tree.nodes[node.parentId];
      if (parent.content === '' && parent.parentId === null) return;

      const sourceOnPath = currentPathIds.includes(node.parentId);
      const targetOnPath = currentPathIds.includes(node.id);
      const isEdgeOnPath = sourceOnPath && targetOnPath;

      edges.push({
        id: `${node.parentId}->${node.id}`,
        source: node.parentId,
        target: node.id,
        type: 'smoothstep',
        animated: isEdgeOnPath,
        style: {
          stroke: isEdgeOnPath ? '#2563eb' : '#9ca3af',
          strokeWidth: isEdgeOnPath ? 2 : 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isEdgeOnPath ? '#2563eb' : '#9ca3af',
        },
      });
    }
  });

  // 3. 计算 dagre 布局
  dagre.layout(g);

  // 4. 将 dagre 坐标应用到节点
  nodes.forEach((node) => {
    const pos = g.node(node.id);
    node.position = { x: pos.x - 20, y: pos.y - 20 }; // 中心对齐
  });

  return { nodes, edges };
}