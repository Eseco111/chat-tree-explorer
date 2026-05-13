import { useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';

import CustomNode from './CustomNode';
import { useTreeStore } from '../store/useTreeStore';
import { convertToFlow } from '../lib/convertToFlow';

// ✅ nodeTypes 定义在组件外部，引用永恒不变
const nodeTypes = { customNode: CustomNode };

export default function MapView() {
  const tree = useTreeStore((s) => s.tree);
  const viewMode = useTreeStore((s) => s.viewMode);   // 新增：视图模式
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);

  // 原有效应：布局 + 聚焦
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = convertToFlow(
      tree,
      tree.currentPath
    );
    setNodes(newNodes);
    setEdges(newEdges);

    const lastPathNodeId = tree.currentPath[tree.currentPath.length - 1];
    const lastNode = newNodes.find((n) => n.id === lastPathNodeId);
    if (lastNode && reactFlowInstanceRef.current) {
      setTimeout(() => {
        reactFlowInstanceRef.current?.setCenter(
          lastNode.position.x + 120,
          lastNode.position.y,
          { zoom: 1.2, duration: 400 }
        );
      }, 100);
    }
  }, [tree, setNodes, setEdges]);

  // 新增效应：处理 viewMode 切换
  useEffect(() => {
    if (viewMode !== 'map') {
      // 切走后，重置视口，避免 React Flow 内部报错
      const timer = setTimeout(() => {
        if (reactFlowInstanceRef.current) {
          reactFlowInstanceRef.current.setViewport({ x: 0, y: 0, zoom: 1 });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
    // 切回来时，React Flow 会自动重新测量父容器尺寸，无需额外操作
  }, [viewMode]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}       // ✅ 直接使用外部常量
        onInit={(instance) => { reactFlowInstanceRef.current = instance; }}
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}