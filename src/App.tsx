import { useTreeStore } from './store/useTreeStore';
import ChatView from './components/ChatView';
import MapView from './components/MapView';
import ViewSwitcher from './components/ViewSwitcher';
import Sidebar from './components/Sidebar';
import ModelSelector from './components/ModelSelector';
import ModelSetupModal from './components/ModelSetupModal';


function App() {
  const viewMode = useTreeStore((s) => s.viewMode);

  return (
    <div className="flex h-screen bg-gray-100">
      <ModelSetupModal />  {/* 放在最前面，自动弹出 */}
      {/* 左侧边栏 */}
      <Sidebar />

      {/* 右侧主区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow p-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">对话树浏览器 MVP</h1>
          <div className="flex items-center gap-4">
            <ModelSelector />
            <ViewSwitcher />
          </div>
        </header>
        <main className="flex-1 p-4 overflow-hidden">
          <div className="w-full max-w-4xl mx-auto h-full">
            {/* 两个视图同时挂载，用 display 切换 */}
            <div style={{ display: viewMode === 'chat' ? 'block' : 'none', height: '100%' }}>
              <ChatView />
            </div>
            <div style={{ display: viewMode === 'map' ? 'block' : 'none', height: '100%' }}>
              <MapView />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;