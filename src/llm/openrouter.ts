import type { LLMConfigOpenRouter } from "@/config";
import type { z } from "zod";

import {
  type LLM,
  LLMError,
  type LLMOptions,
  LLMRateLimitError,
  type Message,
  withRetry,
} from "./llm";
import { type LLMLogger, createLLMLogger } from "./logger";

interface GPTResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export class LLMOpenRouter implements LLM {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private logger: LLMLogger;

  constructor(config: LLMConfigOpenRouter) {
    if (!config.apiKey) {
      throw new Error("OpenRouter API key is not set");
    }
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.temperature = config.temperature;
    this.maxTokens = config.maxTokens;
    this.logger = createLLMLogger(config.logFile);
  }

  public async generate(
    systemPrompt: string,
    messages: Message[],
    jsonMode: boolean,
    responseSchema?: z.ZodSchema,
    options?: LLMOptions,
  ): Promise<string> {
    this.logger.logRequest(systemPrompt, messages);

    const responseObject = await withRetry(
      async () =>
        this.fetchOpenRouterResponse(
          this.apiKey,
          this.model,
          systemPrompt,
          messages,
          jsonMode,
          responseSchema,
        ),
      options,
    );
    const result = responseObject.choices[0].message.content;
    this.logger.log(`LLM OpenRouter response: ${result}`);
    return result;
  }

  private async fetchOpenRouterResponse(
    apiKey: string,
    model: string,
    systemPrompt: string,
    messages: Message[],
    jsonMode: boolean,
    responseSchema?: z.ZodSchema,
  ): Promise<GPTResponse> {
    let additionalBody = {};
    if (jsonMode) {
      additionalBody = {
        response_format: { type: "json_object" },
      };
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://github.com/keitakn/aica",
          "X-Title": "aica",
        },
        body: JSON.stringify({
          model,
          max_tokens: this.maxTokens,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            ...messages.map((message) => ({
              role: message.role,
              content: message.content,
            })),
          ],
          temperature: this.temperature,
          ...additionalBody,
        }),
      },
    );
    if (!response.ok) {
      const body = await response.json();
      if (response.status === 429) {
        throw new LLMRateLimitError("Rate limit exceeded");
      }
      throw new LLMError(`OpenRouter API error: ${body.error.message}`);
    }
    return await response.json();
  }
}
