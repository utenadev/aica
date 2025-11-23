# OpenRouterサポート追加機能の設計

## 1. はじめに

本ドキュメントは、LLMプロバイダーとしてOpenRouterを追加するための実装戦略とテスト方針を定義する。

現在のアーキテクチャはプロバイダーの追加を容易にする拡張性の高い設計となっている。そのため、既存の設計パターンを踏襲することで、低コストかつ高品質な機能追加を目指す。

## 2. 実装戦略

### 概要

実装は、既存のプロバイダー（`openai`, `anthropic`など）と同様のパターンに従う。主な作業は、設定の追加、OpenRouter APIと通信するクライアントクラスの作成、そしてLLMをインスタンス化するファクトリの更新の3点である。

### ファイル変更点

#### 2.1. `src/config.ts` の修正

LLMプロバイダーとして`openrouter`をシステムに認識させ、設定を管理できるようにする。

- **`LLMProvider` 型定義の更新**:
  `LLMProvider` 型に `'openrouter'` を追加する。
- **`LLMConfigOpenRouter` 型の追加**:
  OpenRouter固有の設定（APIキー、モデル名など）を管理するための型を`LLMConfigOpenAI`を参考に定義する。
- **`LLMConfig` 型の更新**:
  `LLMConfig`に`openrouter: LLMConfigOpenRouter`プロパティを追加する。
- **`defaultConfig` の更新**:
  `openrouter`用のデフォルト設定を追加する。APIキーは環境変数 `OPENROUTER_API_KEY` から取得し、デフォルトモデル（例: `google/gemini-flash-1.5`）を指定する。
- **`getDefaultLLMProvider` 関数の更新**:
  環境変数 `OPENROUTER_API_KEY` が存在する場合、デフォルトプロバイダーとして `'openrouter'` を返すようにロジックを修正する。

#### 2.2. `src/llm/openrouter.ts` の新規作成

OpenRouter APIとの通信を担うクライアントクラスを実装する。

- **`LLMOpenRouter` クラスの実装**:
  `LLM` インターフェースを実装する新しいクラスを作成する。このクラスは `src/llm/openai.ts` の `LLMOpenAI` をベースに実装する。
- **APIエンドポイントの変更**:
  リクエストURLをOpenRouterのエンドポイント `https://openrouter.ai/api/v1/chat/completions` に設定する。
- **ヘッダーの調整**:
  - `Authorization` ヘッダーでOpenRouterのAPIキーを送信する。
  - OpenRouter推奨の `HTTP-Referer` や `X-Title` といったカスタムヘッダーを追加する。
- **OpenAI特有ロジックの削除**:
  `LLMOpenAI` に存在する `o`シリーズモデルの判定など、プロバイダー固有のロジックは削除し、汎用的な作りにする。

#### 2.3. `src/llm/factory.ts` の修正

プロバイダー名に応じて適切なLLMクライアントをインスタンス化するファクトリに、`openrouter`の分岐を追加する。

- **`LLMOpenRouter` のインポート**:
  `./openrouter` から `LLMOpenRouter` クラスをインポートする。
- **インスタンス化ロジックの追加**:
  `createLLM` 関数内に `if (provider === 'openrouter')` の条件分岐を追加し、`LLMOpenRouter` のインスタンスを返すように修正する。

## 3. テスト方針

### 概要

テストは、① `LLMOpenRouter` クラス自体の正しさを保証する単体テストと、②既存のテスト資産を活用した結合レベルのテスト、の2つのアプローチで品質を担保する。

### 3.1. `LLMOpenRouter` クラスの単体テスト

`bun:test` のモック機能を活用し、`fetch` 関数をモックすることで、`LLMOpenRouter` クラスをネットワークから完全に分離した状態でテストする。

- **検証項目**:
  - 期待されるAPIエンドポイント (`https://openrouter.ai/api/v1/...`) が呼び出されているか。
  - `Authorization` ヘッダーやその他のカスタムヘッダーが正しく設定されているか。
  - リクエストボディ（モデル名、メッセージ配列など）がOpenRouterのAPI仕様に沿って正しく構築されているか。
  - モックした `fetch` からのレスポンスを正しくパースし、後続の処理に渡せているか。

これにより、実際のAPIコールを行うことなく、クライアント実装の正しさを高速かつ安定的に検証できる。

### 3.2. 既存テストによる結合テスト

`agent.test.ts` など、既存の上位レベルのテストは、特定のLLMプロバイダーに依存しないように `LLMStub` を使って実装されている。

- **テスト方法**:
  テスト実行時は、設定でプロバイダーを `stub` に指定する。これにより、`LLMStub` がダミーの応答を返し、アプリケーションがその応答を元にファイル作成や編集といったアクションを正しく実行できるかを検証する。
- **効果**:
  この仕組みにより、OpenRouter対応を追加しても、既存のテストコードを修正することなく、OpenRouterからの応答（を模したスタブ応答）を受けた場合の一連のアプリケーション動作を担保できる。

## 4. まとめ

本実装戦略は、既存の堅牢なアーキテクチャとテスト戦略に乗っ取ったものであり、低リスクかつ短期間での機能追加を可能にする。単体テストと結合テストの両方で品質を担保することで、信頼性の高い機能を提供できる。
