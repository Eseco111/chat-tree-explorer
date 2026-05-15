import { useEffect, useState, useRef } from 'react';
import { useTreeStore } from '../store/useTreeStore';
import {
  exportConversation,
  importConversation,
  exportConversationToClipboard,
  importConversationFromText,
} from '../lib/exportImport';

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

  // 移动端检测
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // 粘贴导入相关状态
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');

  // 自定义删除确认框
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const conversationIds = Object.keys(meta).filter((id) => {
    if (!search.trim()) return true;
    return meta[id].title.toLowerCase().includes(search.toLowerCase());
  });
  conversationIds.sort((a, b) => meta[b].createdAt - meta[a].createdAt);

  const handleNew = () => {
    createConversation('新对话');
    if (sidebarCollapsed) toggleSidebar();
  };

  // 改为打开自定义确认框，而非原生 confirm
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  // 执行删除并关闭确认框
  const doDelete = () => {
    if (confirmDeleteId) {
      deleteConversation(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  // 导出分流
  const handleExport = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (isMobile) {
      const ok = await exportConversationToClipboard(id, meta[id]);
      if (ok) {
        alert('JSON 已复制到剪贴板');
      } else {
        alert('复制失败，请检查浏览器权限');
      }
    } else {
      exportConversation(id, meta[id]);
    }
  };

  // 导入按钮点击
  const handleImportClick = () => {
    if (isMobile) {
      setPasteModalOpen(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  // 桌面端文件选择回调
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const success = await importConversation(file);
    if (!success) {
      alert('导入失败，请检查文件格式。');
    }
    e.target.value = '';
  };

  // 移动端粘贴导入
  const handlePasteImport = async () => {
    if (!pasteText.trim()) return;
    const success = await importConversationFromText(pasteText);
    if (success) {
      setPasteModalOpen(false);
      setPasteText('');
    } else {
      alert('导入失败，请检查 JSON 格式是否正确');
    }
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

  // 侧边栏内容（折叠/展开）
  const sidebarContent = sidebarCollapsed ? (
    <div className="w-12 h-full bg-gray-900 text-white flex flex-col items-center py-3 border-r border-gray-700 gap-3">
      <button onClick={toggleSidebar} className="text-gray-400 hover:text-white text-lg" title="展开侧边栏">
        ☰
      </button>
      <button onClick={handleNew} className="text-gray-400 hover:text-white text-lg" title="新建对话">
        ＋
      </button>
      <button onClick={handleImportClick} className="text-gray-400 hover:text-white text-lg" title="导入对话">
        ⬆
      </button>
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {/* 移动端粘贴弹窗（折叠状态） */}
      {pasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 w-11/12 max-w-md">
            <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">粘贴对话 JSON</h3>
            <textarea
              className="w-full h-36 border rounded p-2 text-sm bg-gray-50 dark:bg-gray-700 text-black dark:text-white"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="将导出的 JSON 文本粘贴到这里"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setPasteModalOpen(false)} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">
                取消
              </button>
              <button onClick={handlePasteImport} className="px-3 py-1 text-sm bg-blue-600 text-white rounded">
                导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className="w-64 h-full bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="h-10 flex items-center px-4 border-b border-gray-700">
        <h1 className="text-lg font-bold text-amber-500 select-none tracking-tight">ChatTree</h1>
      </div>
      {/* 新建 + 折叠 */}
      <div className="p-3 flex items-center justify-between">
        <button onClick={handleNew} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition">
          + 新建对话
        </button>
        <button onClick={toggleSidebar} className="ml-2 text-gray-400 hover:text-white text-lg" title="收起侧边栏">
          ✕
        </button>
      </div>
      {/* 搜索 */}
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
                  isActive ? 'bg-gray-700 border-blue-500' : 'border-transparent hover:bg-gray-800'
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
                  <button onClick={(e) => startEditing(e, id, meta[id].title)} className="text-gray-400 hover:text-yellow-400" title="重命名对话">✎</button>
                  <button onClick={(e) => handleExport(e, id)} className="text-gray-400 hover:text-blue-400" title="导出对话">⬇</button>
                  <button onClick={(e) => handleDelete(e, id)} className="text-gray-400 hover:text-red-400" title="删除对话">✕</button>
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
        <button onClick={handleImportClick} className="w-full py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm transition mb-1">
          导入对话
        </button>
        <div className="text-center">v3.0</div>
      </div>
      {/* 移动端粘贴弹窗（展开状态） */}
      {pasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 w-11/12 max-w-md">
            <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">粘贴对话 JSON</h3>
            <textarea
              className="w-full h-36 border rounded p-2 text-sm bg-gray-50 dark:bg-gray-700 text-black dark:text-white"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="将导出的 JSON 文本粘贴到这里"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setPasteModalOpen(false)} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">取消</button>
              <button onClick={handlePasteImport} className="px-3 py-1 text-sm bg-blue-600 text-white rounded">导入</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {sidebarContent}

      {/* 自定义删除确认框（独立渲染，不受折叠影响） */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 w-11/12 max-w-sm">
            <p className="text-gray-900 dark:text-white mb-4">确定删除此对话？</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 rounded"
              >
                取消
              </button>
              <button
                onClick={doDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}