import { useCallback, useRef, useState } from 'react';
import { useTreeStore } from '../store/useTreeStore';
import { streamChat, getActiveClient, createClient } from '../lib/api';
import { addNode, getPathTo, buildMessages } from '../lib/tree';

export function useStreamReply() {
  const generatingRef = useRef(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(async () => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setIsGenerating(true);

    const store = useTreeStore.getState();
    let tree = store.tree;

    // 模型检查（合并原有两个判断）
    const activeModel = store.models[store.activeModelId];
    if (!activeModel || !activeModel.apiKey) {
      console.warn('模型未配置或缺少 API Key，无法生成回复');
      generatingRef.current = false;
      setIsGenerating(false);
      return;
    }

    if (!getActiveClient()) {
      createClient(activeModel);
    }

    const messages = buildMessages(tree);
    const lastUserNodeId = tree.currentPath[tree.currentPath.length - 1];
    if (!lastUserNodeId) {
      generatingRef.current = false;
      setIsGenerating(false);
      return;
    }

    // 创建占位 assistant 节点
    tree = addNode(tree, lastUserNodeId, 'assistant', '');
    tree = {
      ...tree,
      currentPath: [
        ...getPathTo(tree, tree.nodes[lastUserNodeId].childrenIds.slice(-1)[0]),
      ],
    };
    useTreeStore.getState().setTree(tree);
    const assistantId = tree.currentPath[tree.currentPath.length - 1];

    try {
      let fullContent = '';
      const stream = streamChat(messages, activeModel.model);
      for await (const chunk of stream) {
        fullContent += chunk;
        const currentTree = useTreeStore.getState().tree;
        const updatedNodes = {
          ...currentTree.nodes,
          [assistantId]: { ...currentTree.nodes[assistantId], content: fullContent },
        };
        useTreeStore.getState().setTree({ ...currentTree, nodes: updatedNodes });
      }
    } catch (error) {
      console.error('流式生成失败:', error);
    } finally {
      generatingRef.current = false;
      setIsGenerating(false);
    }
  }, []);

  return { generate, isGenerating };
}