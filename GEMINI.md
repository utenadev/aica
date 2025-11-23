# aica - AI Code Analyzer

## Project Overview

`aica` is a command-line tool designed to bring the power of AI to your terminal for code analysis and development tasks. It is built with Bun and TypeScript, making it a modern and efficient tool for developers. The project is open-source, customizable, and platform-independent, offering an alternative to tools like `pr-agent` and `cursor`.

Key features include:
- AI-powered code review
- An interactive AI agent for coding tasks
- Automatic generation of commit messages and pull request descriptions
- Knowledge retrieval from your codebase using symbol-based and vector-based search
- Support for multiple LLM providers (OpenAI, Anthropic, Google, OpenRouter)
- Customizable prompts and behavior through a `aica.toml` configuration file
- GitHub Actions integration for seamless CI/CD workflows

## Building and Running

### Prerequisites

- [Bun](https://bun.sh/docs/installation)

### Installation and Building

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/dotneet/aica.git
    cd aica
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

3.  **Build the executable:**
    ```bash
    bun run build
    ```
    This creates a single binary executable at `dist/aica`.

### Running the Application

Once built, you can run the tool using the `aica` command.

**Run the development version:**
```bash
bun run src/main.ts [command]
```

**Run the compiled executable:**
```bash
./dist/aica [command]
```

### Running Tests and Linting

-   **Linting:**
    ```bash
    bun run lint
    ```

-   **Auto-fixing (where possible):**
    ```bash
    bun run check
    ```

## Development Conventions

-   **Language:** The project is written in TypeScript.
-   **Package Manager:** It uses `bun` for package management and script execution.
-   **Code Style and Formatting:** Code quality is maintained using `biome`. The configuration can be found in `biome.json`.
-   **Configuration:** The application is configured through a `aica.toml` file. A detailed example is provided in `aica.example.toml`.
-   **Extensibility:** The tool is designed to be extensible, with support for custom prompts and multiple LLM providers.
-   **GitHub Actions:** The project includes workflows for CI/CD, which can be found in the `.github/workflows` directory.
