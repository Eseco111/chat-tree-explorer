import { useCallback, useRef, useState } from 'react';
import { useTreeStore } from '../store/useTreeStore';
import { streamChat, initFromStorage } from '../lib/api';
import { addNode, getPathTo, buildMessages } from '../lib/tree';

export function useStreamReply() {
  const generatingRef = useRef(false);          // 仍保留，用于防并发
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(async () => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setIsGenerating(true);

    const store = useTreeStore.getState();
    let tree = store.tree;

    if (!initFromStorage()) {
      console.error('未设置 API Key');
      generatingRef.current = false;
      setIsGenerating(false);
      return;
    }

    const messages = buildMessages(tree);
    const lastUserNodeId = tree.currentPath[tree.currentPath.length - 1];
    if (!lastUserNodeId) {
      generatingRef.current = false;
      setIsGenerating(false);
      return;
    }

    // 创建空的 assistant 节点
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
      const stream = streamChat(messages);
      for await (const chunk of stream) {
        fullContent += chunk;
        const currentTree = useTreeStore.getState().tree;
        const updatedNodes = {
          ...currentTree.nodes,
          [assistantId]: {
            ...currentTree.nodes[assistantId],
            content: fullContent,
          },
        };
        useTreeStore.getState().setTree({
          ...currentTree,
          nodes: updatedNodes,
        });
      }
    } catch (error) {
      console.error('流式生成失败:', error);
      const currentTree = useTreeStore.getState().tree;
      if (currentTree.nodes[assistantId]) {
        const updatedNodes = {
          ...currentTree.nodes,
          [assistantId]: {
            ...currentTree.nodes[assistantId],
            content: '抱歉，生成回复时出错。',
          },
        };
        useTreeStore.getState().setTree({
          ...currentTree,
          nodes: updatedNodes,
        });
      }
    } finally {
      generatingRef.current = false;
      setIsGenerating(false);
    }
  }, []);

  return { generate, isGenerating };   // 现在 isGenerating 是 boolean
}