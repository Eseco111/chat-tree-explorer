// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { useTreeStore } from '../store/useTreeStore';

declare global {
  interface Window {
    __store?: typeof useTreeStore; // 可选，用于调试
  }
}