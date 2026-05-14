import { useState } from 'react';
import { useTreeStore } from '../store/useTreeStore';
import { createClient } from '../lib/api';
import type { ModelConfig } from '../types';

type FormData = {
  name: string;
  baseURL: string;
  apiKey: string;
  model: string;
  provider: ModelConfig['provider'];
};

export default function ModelSelector() {
  const models = useTreeStore((s) => s.models);
  const activeModelId = useTreeStore((s) => s.activeModelId);
  const setActiveModel = useTreeStore((s) => s.setActiveModel);
  const addModel = useTreeStore((s) => s.addModel);
  const updateModel = useTreeStore((s) => s.updateModel);
  const removeModel = useTreeStore((s) => s.removeModel);

  const [showAdd, setShowAdd] = useState(false);
  const [editModelId, setEditModelId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    name: '',
    baseURL: '',
    apiKey: '',
    model: '',
    provider: 'custom',
  });
  const [error, setError] = useState('');

  const modelList = Object.values(models);
  const activeModel = models[activeModelId];

  const resetForm = () => {
    setForm({ name: '', baseURL: '', apiKey: '', model: '', provider: 'custom' });
    setError('');
  };

  const openEdit = (model: ModelConfig) => {
    setEditModelId(model.id);
    setForm({
      name: model.name,
      baseURL: model.baseURL,
      apiKey: model.apiKey,
      model: model.model,
      provider: model.provider,
    });
    setError('');
    setShowAdd(false);
  };

  const validate = (): boolean => {
    if (!form.name.trim() || !form.baseURL.trim() || !form.apiKey.trim() || !form.model.trim()) {
      setError('请填写所有必填字段');
      return false;
    }
    if (!form.baseURL.startsWith('http')) {
      setError('Base URL 需以 http 开头');
      return false;
    }
    setError('');
    return true;
  };

  const handleAdd = () => {
    if (!validate()) return;
    const id = `model-${Date.now()}`;
    const newModel: ModelConfig = { ...form, id };
    addModel(newModel);
    setActiveModel(id);
    createClient(newModel);
    setShowAdd(false);
    resetForm();
  };

  const handleEdit = () => {
    if (!editModelId || !validate()) return;
    updateModel(editModelId, form);
    if (editModelId === activeModelId) {
      createClient({ ...models[editModelId], ...form });
    }
    setEditModelId(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('确定删除此模型？')) {
      removeModel(id);
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      <select
        value={activeModelId}
        onChange={(e) => {
          const id = e.target.value;
          setActiveModel(id);
          if (id && models[id]?.apiKey) createClient(models[id]);
        }}
        className="text-sm border rounded px-2 py-1 bg-white min-w-[160px]"
      >
        {modelList.length === 0 && <option value="">无模型</option>}
        {modelList.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>

      <button
        onClick={() => { setShowAdd(true); setEditModelId(null); resetForm(); }}
        className="text-sm bg-gray-200 hover:bg-gray-300 rounded px-2 py-1"
        title="添加模型"
      >＋</button>

      {activeModel && (
        <>
          <button
            onClick={() => openEdit(activeModel)}
            className="text-sm bg-gray-200 hover:bg-gray-300 rounded px-2 py-1"
            title="编辑当前模型"
          >✎</button>
          <button
            onClick={() => handleDelete(activeModel.id)}
            className="text-sm bg-gray-200 hover:bg-red-200 rounded px-2 py-1"
            title="删除当前模型"
          >✕</button>
        </>
      )}

      {/* 添加 / 编辑弹窗 */}
      {(showAdd || editModelId) && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => { setShowAdd(false); setEditModelId(null); }} />
          <div className="absolute top-12 right-0 z-50 bg-white p-5 shadow-xl rounded-lg border w-80">
            <h3 className="text-lg font-bold mb-3">{editModelId ? '编辑模型' : '添加模型'}</h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs">名称 <span className="text-gray-400">（随意填写）</span></label>
                <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="显示名称" />
              </div>
              <div>
                <label className="text-xs">提供商标识 <span className="text-gray-400">（可随意选择）</span></label>
                <select className="w-full border rounded px-2 py-1 text-sm" value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value as ModelConfig['provider'] })}>
                  <option value="deepseek">DeepSeek</option>
                  <option value="openai">OpenAI</option>
                  <option value="custom">自定义</option>
                </select>
              </div>
              <div>
                <label className="text-xs">Base URL <span className="text-red-500">* 按官方填</span></label>
                <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={form.baseURL}
                  onChange={(e) => setForm({ ...form, baseURL: e.target.value })} placeholder="https://api.deepseek.com" />
              </div>
              <div>
                <label className="text-xs">API Key <span className="text-red-500">* 必须真实</span></label>
                <input type="password" className="w-full border rounded px-2 py-1 text-sm" value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder="sk-..." />
              </div>
              <div>
                <label className="text-xs">模型名 <span className="text-red-500">* 按官方填</span></label>
                <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="deepseek-v4-flash" />
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => { setShowAdd(false); setEditModelId(null); }}
                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">取消</button>
              <button onClick={editModelId ? handleEdit : handleAdd}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
                {editModelId ? '保存' : '添加'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}