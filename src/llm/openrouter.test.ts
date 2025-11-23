import { afterEach, describe, expect, mock, test } from "bun:test";
import type { LLMConfigOpenRouter } from "@/config";
import { LLMOpenRouter } from "./openrouter";

describe("LLMOpenRouter", () => {
  afterEach(() => {
    mock.restore();
  });

  test("generate method should call fetch with correct parameters", async () => {
    const config: LLMConfigOpenRouter = {
      apiKey: "test-api-key",
      model: "google/gemini-flash-1.5",
      temperature: 0.7,
      maxTokens: 100,
      logFile: undefined,
    };

    const mockResponse = {
      choices: [{ message: { content: "Hello, world!" } }],
    };

    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    ) as typeof fetch & { mock: Mock<typeof fetch> };
    global.fetch = fetchMock;

    const llm = new LLMOpenRouter(config);
    const result = await llm.generate(
      "System prompt",
      [{ role: "user", content: "User message" }],
      false,
    );

    expect(result).toBe("Hello, world!");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchCall = (global.fetch as { mock: { calls: any[] } }).mock
      .calls[0];
    const fetchUrl = fetchCall[0];
    const fetchOptions = fetchCall[1] as RequestInit;

    expect(fetchUrl).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(fetchOptions.method).toBe("POST");

    const headers = fetchOptions.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-api-key");
    expect(headers["HTTP-Referer"]).toBe("https://github.com/keitakn/aica");
    expect(headers["X-Title"]).toBe("aica");

    const body = JSON.parse(fetchOptions.body as string);
    expect(body.model).toBe("google/gemini-flash-1.5");
    expect(body.temperature).toBe(0.7);
    expect(body.max_tokens).toBe(100);
    expect(body.messages).toEqual([
      { role: "system", content: "System prompt" },
      { role: "user", content: "User message" },
    ]);
  });

  test("should throw LLMError on API failure", async () => {
    const config: LLMConfigOpenRouter = {
      apiKey: "test-api-key",
      model: "google/gemini-flash-1.5",
      temperature: 0.7,
      maxTokens: 100,
      logFile: undefined,
    };

    global.fetch = mock(() => {
      return Promise.resolve(
        new Response(JSON.stringify({ error: { message: "Test error" } }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    const llm = new LLMOpenRouter(config);

    await expect(
      llm.generate(
        "System prompt",
        [{ role: "user", content: "User message" }],
        false,
      ),
    ).rejects.toThrow("OpenRouter API error: Test error");
  });
});
