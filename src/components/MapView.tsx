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

const nodeTypes = { customNode: CustomNode };

export default function MapView() {
  const tree = useTreeStore((s) => s.tree);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = convertToFlow(
      tree,
      tree.currentPath
    );
    setNodes(newNodes);
    setEdges(newEdges);

    // 聚焦到当前路径最后一个节点
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

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onInit={(instance) => {
          reactFlowInstanceRef.current = instance;
        }}
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}