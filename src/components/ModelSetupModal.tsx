import { useState } from 'react';
import { useTreeStore } from '../store/useTreeStore';
import { createClient } from '../lib/api';
import type { ModelConfig } from '../types';

export default function ModelSetupModal() {
  const models = useTreeStore((s) => s.models);
  const activeModelId = useTreeStore((s) => s.activeModelId);
  const addModel = useTreeStore((s) => s.addModel);
  const setActiveModel = useTreeStore((s) => s.setActiveModel);

  const [form, setForm] = useState({
    name: '',
    baseURL: '',
    apiKey: '',
    model: '',
  });
  const [error, setError] = useState('');

  if (Object.keys(models).length > 0 && activeModelId && models[activeModelId]?.apiKey) {
    return null;
  }

  const handleSave = () => {
    const { name, baseURL, apiKey, model } = form;
    if (!name.trim() || !baseURL.trim() || !apiKey.trim() || !model.trim()) {
      setError('请填写所有必填字段');
      return;
    }
    if (!baseURL.startsWith('http')) {
      setError('Base URL 需以 http 开头');
      return;
    }
    const id = `model-${Date.now()}`;
    const newModel: ModelConfig = {
      id,
      name,
      provider: 'custom',   // 固定为 custom
      baseURL,
      apiKey,
      model,
    };
    addModel(newModel);
    setActiveModel(id);
    createClient(newModel);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">添加你的第一个模型</h2>
        <p className="text-sm text-gray-600 mb-4">配置一个 AI 模型后才能开始对话。</p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              名称 <span className="text-gray-400">（随意填写）</span>
            </label>
            <input
              type="text"
              placeholder="例如：我的 DeepSeek"
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Base URL <span className="text-red-500">*（必须与官方文档一致）</span>
            </label>
            <input
              type="text"
              placeholder="https://api.deepseek.com（请查阅官方文档）"
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.baseURL}
              onChange={(e) => setForm({ ...form, baseURL: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              API Key <span className="text-red-500">*（必须为有效 Key）</span>
            </label>
            <input
              type="password"
              placeholder="sk-..."
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              模型名 <span className="text-red-500">*（必须与官方模型代号一致）</span>
            </label>
            <input
              type="text"
              placeholder="deepseek-v4-flash（请查阅官方文档）"
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>
        <button
          onClick={handleSave}
          className="w-full mt-4 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          添加并开始对话
        </button>
      </div>
    </div>
  );
}