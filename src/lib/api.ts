import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

let client: OpenAI | null = null;

export function initClient(apiKey: string): void {
  client = new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com',     // ← 改成 DeepSeek 地址
    dangerouslyAllowBrowser: true,
  });
}

export function initFromStorage(): boolean {
  const key = localStorage.getItem('deepseek-api-key');   // ← 改用新 key 名
  if (key) {
    initClient(key);
    return true;
  }
  return false;
}

export async function* streamChat(
  messages: ChatCompletionMessageParam[]
): AsyncGenerator<string> {
  if (!client) {
    throw new Error('API 客户端未初始化，请先设置 API Key');
  }
  const stream = await client.chat.completions.create({
    model: 'deepseek-v4-flash',     // ← 推荐模型（速度快、成本低）[5†L8-L10]
    messages,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}