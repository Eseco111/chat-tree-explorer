import type { AppData } from '../types';

const STORAGE_KEY = 'chat-app-data';

export function loadAppData(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppData) : null;
  } catch (e) {
    console.error('加载应用数据失败:', e);
    return null;
  }
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('保存应用数据失败:', e);
  }
}

// 清除所有数据（调试用）
export function clearAppData(): void {
  localStorage.removeItem(STORAGE_KEY);
}