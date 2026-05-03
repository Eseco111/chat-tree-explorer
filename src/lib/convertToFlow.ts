import dagre from 'dagre';
import { MarkerType } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import type { ConversationTree } from '../types';


interface NodeDisplayData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isCurrentPath: boolean;
  isLeaf: boolean;
  childrenIds: string[];
}




export function convertToFlow(
  tree: ConversationTree,
  currentPathIds: string[]
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: 'LR',
    nodesep: 20,
    ranksep: 120,
    edgesep: 10,
    marginx: 20,
    marginy: 20,
  });

  const pathSet = new Set(currentPathIds);
  // 用映射表存储每个节点的自定义数据，不污染 dagre 节点
  const nodeDataMap: Record<string, NodeDisplayData> = {}; // 使用新接口

  for (const nodeId of Object.keys(tree.nodes)) {
    const node = tree.nodes[nodeId];
    if (node.content === '' && node.parentId === null) continue;
    const isOnPath = pathSet.has(nodeId);
    g.setNode(nodeId, { width: 40, height: 40 });
    nodeDataMap[nodeId] = {
      id: nodeId,
      role: node.role,
      content: node.content,
      timestamp: node.timestamp,
      isCurrentPath: isOnPath,
      isLeaf: (node.childrenIds ?? []).length === 0,
      childrenIds: node.childrenIds ?? [],
    };
  }

  // 2. 添加边，主路径边设置更高权重
  for (const nodeId of Object.keys(tree.nodes)) {
    const node = tree.nodes[nodeId];
    if (!node.parentId || !tree.nodes[node.parentId]) continue;
    const parent = tree.nodes[node.parentId];
    if (parent.content === '' && parent.parentId === null) continue;
    const sourceOnPath = pathSet.has(node.parentId);
    const targetOnPath = pathSet.has(nodeId);
    const isEdgeOnPath = sourceOnPath && targetOnPath;
    const weight = isEdgeOnPath ? 10 : 1;
    g.setEdge(node.parentId, node.id, { weight });
  }

  // 3. 执行 dagre 布局
  dagre.layout(g);

  // 4. 生成 React Flow 节点和边
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  for (const nodeId of g.nodes()) {
    const { x, y } = g.node(nodeId);
    nodes.push({
      id: nodeId,
      type: 'customNode',
      position: { x: x - 20, y: y - 20 },
      data: nodeDataMap[nodeId],
    });
  }

  for (const edge of g.edges()) {
    const sourceOnPath = pathSet.has(edge.v);
    const targetOnPath = pathSet.has(edge.w);
    const isEdgeOnPath = sourceOnPath && targetOnPath;
    edges.push({
      id: `${edge.v}-${edge.w}`,
      source: edge.v,
      target: edge.w,
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

  return { nodes, edges };
}