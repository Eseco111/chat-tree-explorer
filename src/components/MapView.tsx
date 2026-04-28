import { useEffect, useRef } from 'react';
import ReactFlow, {
  Background, Controls, MiniMap, useNodesState, useEdgesState,
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
  
  // 使用 ref 保存上一次的树节点ID集合
  const prevNodeIdsRef = useRef<string[]>([]);

  useEffect(() => {
    const currentIds = Object.keys(tree.nodes).sort();
    const prevIds = prevNodeIdsRef.current;
    
    // 深度比较节点ID集合，避免不必要更新
    if (
      prevIds.length !== currentIds.length ||
      !currentIds.every((id, i) => id === prevIds[i])
    ) {
      prevNodeIdsRef.current = currentIds;
      const initialData = convertToFlow(tree, tree.currentPath);
      setNodes(initialData.nodes);
      setEdges(initialData.edges);
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
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}