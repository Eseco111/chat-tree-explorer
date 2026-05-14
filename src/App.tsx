import { useTreeStore } from './store/useTreeStore';
import ChatView from './components/ChatView';
import MapView from './components/MapView';
import ViewSwitcher from './components/ViewSwitcher';
import Sidebar from './components/Sidebar';
import ModelSelector from './components/ModelSelector';
import ModelSetupModal from './components/ModelSetupModal';

function App() {
  const viewMode = useTreeStore((s) => s.viewMode);
  const activeId = useTreeStore((s) => s.activeId);

  return (
    <div className="flex h-screen bg-gray-100">
      <ModelSetupModal />
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow p-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">对话树浏览器 MVP</h1>
          <div className="flex items-center gap-4">
            <ModelSelector />
            {activeId && <ViewSwitcher />}
          </div>
        </header>

        <main className="flex-1 p-4 overflow-hidden">
          {activeId ? (
            <div className="w-full max-w-4xl mx-auto h-full">
              <div style={{ display: viewMode === 'chat' ? 'block' : 'none', height: '100%' }}>
                <ChatView />
              </div>
              <div style={{ display: viewMode === 'map' ? 'block' : 'none', height: '100%' }}>
                <MapView />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p className="text-2xl mb-3">📭 暂无对话</p>
                <p className="text-sm">点击左侧「+ 新建对话」开始，或导入已有对话</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;