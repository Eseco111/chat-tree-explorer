import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { ModelConfig } from '../types';

let activeClient: OpenAI | null = null;

export function createClient(config: ModelConfig): OpenAI {
  activeClient = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    dangerouslyAllowBrowser: true,
  });
  return activeClient;
}

export function getActiveClient(): OpenAI | null {
  return activeClient;
}

export async function* streamChat(
  messages: ChatCompletionMessageParam[],
  model: string,
  options?: { temperature?: number }  // 新增可选参数
): AsyncGenerator<string> {
  if (!activeClient) {
    throw new Error('API 客户端未初始化');
  }
  const stream = await activeClient.chat.completions.create({
    model,
    messages,
    stream: true,
    temperature: options?.temperature ?? 0.3,  // 默认 0.3，减少随机性
  });
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}