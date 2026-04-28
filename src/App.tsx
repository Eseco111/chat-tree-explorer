import ChatView from './components/ChatView';
import ApiKeySetup from './components/ApiKeySetup';   // 新增导入
// 临时清除旧 OpenAI Key（只运行一次即可删除本段）
if (!localStorage.getItem('deepseek-api-key')) {
  localStorage.removeItem('openai-api-key');
}
function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ApiKeySetup />   {/* 放在最外层 div 的开头 */}
      <header className="bg-white shadow p-4 text-center">
        <h1 className="text-xl font-bold text-gray-800">对话树浏览器 MVP</h1>
      </header>
      <main className="flex-1 p-4 flex justify-center">
        <div className="w-full max-w-4xl h-[calc(100vh-8rem)]">
          <ChatView />
        </div>
      </main>
    </div>
  );
}

export default App;