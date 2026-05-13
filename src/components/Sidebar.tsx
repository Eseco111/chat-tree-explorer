import { useTreeStore } from '../store/useTreeStore';
import { useState } from 'react';

export default function Sidebar() {
  const activeId = useTreeStore((s) => s.activeId);
  const meta = useTreeStore((s) => s.meta);
  const switchConversation = useTreeStore((s) => s.switchConversation);
  const deleteConversation = useTreeStore((s) => s.deleteConversation);
  const createConversation = useTreeStore((s) => s.createConversation);

  const [search, setSearch] = useState('');

  // 过滤对话列表
  const conversationIds = Object.keys(meta).filter((id) => {
    if (!search.trim()) return true;
    return meta[id].title.toLowerCase().includes(search.toLowerCase());
  });

  // 按创建时间倒序排列
  conversationIds.sort((a, b) => meta[b].createdAt - meta[a].createdAt);

  const handleNew = () => {
    createConversation('新对话');
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定删除此对话？')) {
      deleteConversation(id);
    }
  };

  return (
    <div className="w-64 h-full bg-gray-900 text-white flex flex-col">
      {/* 头部 */}
      <div className="p-3 border-b border-gray-700">
        <button
          onClick={handleNew}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition"
        >
          + 新建对话
        </button>
        <input
          type="text"
          placeholder="搜索对话..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mt-2 px-2 py-1 rounded bg-gray-800 text-sm border border-gray-700 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* 对话列表 */}
      <div className="flex-1 overflow-y-auto">
        {conversationIds.length === 0 ? (
          <p className="text-gray-400 text-sm p-3 text-center">暂无对话</p>
        ) : (
          conversationIds.map((id) => {
            const isActive = id === activeId;
            return (
              <div
                key={id}
                onClick={() => switchConversation(id)}
                className={`group flex items-center justify-between px-3 py-2 cursor-pointer border-l-2 transition ${
                  isActive
                    ? 'bg-gray-700 border-blue-500'
                    : 'border-transparent hover:bg-gray-800'
                }`}
              >
                <div className="flex-1 truncate">
                  <div className="text-sm truncate">{meta[id].title}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(meta[id].createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(e, id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition ml-2"
                  title="删除对话"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* 底部信息 */}
      <div className="p-2 border-t border-gray-700 text-xs text-gray-500 text-center">
        对话树浏览器 v2.0
      </div>
    </div>
  );
}