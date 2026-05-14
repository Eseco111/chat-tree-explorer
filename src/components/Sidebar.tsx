import { useRef, useState } from 'react';
import { useTreeStore } from '../store/useTreeStore';
import { exportConversation, importConversation } from '../lib/exportImport';

export default function Sidebar() {
  const activeId = useTreeStore((s) => s.activeId);
  const meta = useTreeStore((s) => s.meta);
  const switchConversation = useTreeStore((s) => s.switchConversation);
  const deleteConversation = useTreeStore((s) => s.deleteConversation);
  const createConversation = useTreeStore((s) => s.createConversation);
  const renameConversation = useTreeStore((s) => s.renameConversation);
  const sidebarCollapsed = useTreeStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useTreeStore((s) => s.toggleSidebar);

  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');

  const conversationIds = Object.keys(meta).filter((id) => {
    if (!search.trim()) return true;
    return meta[id].title.toLowerCase().includes(search.toLowerCase());
  });
  conversationIds.sort((a, b) => meta[b].createdAt - meta[a].createdAt);

  const handleNew = () => {
    createConversation('新对话');
    // 如果侧边栏是折叠的，新建对话时自动展开方便查看
    if (sidebarCollapsed) toggleSidebar();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定删除此对话？')) {
      deleteConversation(id);
    }
  };

  const handleExport = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    exportConversation(id, meta[id]);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const success = await importConversation(file);
    if (!success) {
      alert('导入失败，请检查文件格式。');   // 只在失败时提示
    }
    e.target.value = '';
  };

  const startEditing = (e: React.MouseEvent, id: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingTitleId(id);
    setEditTitleValue(currentTitle);
  };

  const handleTitleSubmit = (id: string) => {
    if (editTitleValue.trim()) {
      renameConversation(id, editTitleValue.trim());
    }
    setEditingTitleId(null);
  };

  // 折叠状态：仅显示窄栏
  if (sidebarCollapsed) {
    return (
      <div className="w-12 h-full bg-gray-900 text-white flex flex-col items-center py-3 border-r border-gray-700 gap-3">
        <button
          onClick={toggleSidebar}
          className="text-gray-400 hover:text-white text-lg"
          title="展开侧边栏"
        >
          ☰
        </button>
        <button
          onClick={handleNew}
          className="text-gray-400 hover:text-white text-lg"
          title="新建对话"
        >
          ＋
        </button>
        {/* 可以额外加一个导入图标按钮（可选） */}
        <button
          onClick={handleImportClick}
          className="text-gray-400 hover:text-white text-lg"
          title="导入对话"
        >
          ⬆
        </button>
        {/* 隐藏的 file input */}
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        {/* 底部留空，不再显示版本信息 */}
      </div>
    );
  }

  // 展开状态：完整侧边栏
  return (
    <div className="w-64 h-full bg-gray-900 text-white flex flex-col">
      {/* 头部：新建按钮 + 折叠按钮 */}
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <button
          onClick={handleNew}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition"
        >
          + 新建对话
        </button>
        <button
          onClick={toggleSidebar}
          className="ml-2 text-gray-400 hover:text-white text-lg"
          title="收起侧边栏"
        >
          ✕
        </button>
      </div>

      {/* 搜索框 */}
      <div className="px-3 py-2">
        <input
          type="text"
          placeholder="搜索对话..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-2 py-1 rounded bg-gray-800 text-sm border border-gray-700 focus:outline-none focus:border-blue-500"
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
                onClick={async () => await switchConversation(id)}
                className={`group flex items-center justify-between px-3 py-2 cursor-pointer border-l-2 transition ${
                  isActive
                    ? 'bg-gray-700 border-blue-500'
                    : 'border-transparent hover:bg-gray-800'
                }`}
              >
                <div className="flex-1 truncate">
                  {editingTitleId === id ? (
                    <input
                      className="text-sm bg-gray-800 text-white border border-blue-500 rounded px-1 w-full"
                      value={editTitleValue}
                      onChange={(e) => setEditTitleValue(e.target.value)}
                      onBlur={() => handleTitleSubmit(id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleTitleSubmit(id);
                        if (e.key === 'Escape') setEditingTitleId(null);
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div
                      className="text-sm truncate"
                      onDoubleClick={(e) => startEditing(e, id, meta[id].title)}
                      title="双击修改标题"
                    >
                      {meta[id].title}
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    {new Date(meta[id].createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => startEditing(e, id, meta[id].title)}
                    className="text-gray-400 hover:text-yellow-400"
                    title="重命名对话"
                  >
                    ✎
                  </button>
                  <button
                    onClick={(e) => handleExport(e, id)}
                    className="text-gray-400 hover:text-blue-400"
                    title="导出对话"
                  >
                    ⬇
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, id)}
                    className="text-gray-400 hover:text-red-400"
                    title="删除对话"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 底部区域 */}
      <div className="p-2 border-t border-gray-700 text-xs text-gray-500">
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button
          onClick={handleImportClick}
          className="w-full py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm transition mb-1"
        >
          导入对话
        </button>
        <div className="text-center">对话树浏览器 v2.0</div>
      </div>
    </div>
  );
}