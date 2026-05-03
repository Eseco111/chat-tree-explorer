import { useState } from 'react';
import { initFromStorage } from '../lib/api';

export default function ApiKeySetup() {
  const [key, setKey] = useState('');
  const [hasKey, setHasKey] = useState(initFromStorage());

  const saveKey = () => {
    if (key.trim()) {
      localStorage.setItem('deepseek-api-key', key.trim());   // ← 改用新 key 名
      // localStorage.setItem('openai-api-key', key.trim());
      initFromStorage(); // 重新初始化
      setHasKey(true);
    }
  };

  if (hasKey) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-80">
        <h2 className="text-lg font-bold mb-2">设置 DeepSeek API Key</h2>   {/* ← 文字更新 */}
        {/* <h2 className="text-lg font-bold mb-2">设置 OpenAI API Key</h2> */}
        <p className="text-sm text-gray-600 mb-3">
          你的 Key 仅保存在本地浏览器
        </p>
        <input
          type="password"
          className="w-full border p-2 rounded mb-3 text-sm"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-..."
        />
        <button
          onClick={saveKey}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          保存并开始
        </button>
      </div>
    </div>
  );
}