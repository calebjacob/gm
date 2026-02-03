---
name: AI Game Master Web App
overview: Build a full-stack AI Game Master (Dungeon Master) web app with React Router (framework mode), Material UI, CSS Modules, LangGraph (TypeScript), SQLite for relational data, and a RAG pipeline for rules and campaign content. Users upload rules and world files, create campaigns from them, and converse with an AI GM that resolves actions using retrieved context.
todos: []
isProject: false
---

# AI Game Master Web App — Implementation Plan

## Architecture Overview

```mermaid
flowchart TB
  subgraph client [Frontend]
    UI[React Router + MUI]
    Upload[File Upload]
    Chat[Campaign Chat]
  end
  subgraph server [Server / API]
    Loaders[Route Loaders]
    Actions[Route Actions]
    API[Streaming API Route]
  end
  subgraph data [Data Layer]
    SQLite[(SQLite)]
  end
  subgraph sqliteExt [SQLite Extensions]
    Vec[sqlite-vec]
    Rembed[sqlite-rembed]
  end
  subgraph agent [LangGraph GM]
    Retrieve[Retrieve Node]
    GM[GM Node]
  end
  UI --> Loaders
  UI --> Actions
  UI --> API
  Upload --> Actions
  Chat --> API
  Actions --> SQLite
  API --> Retrieve
  Retrieve --> SQLite
  SQLite --> Vec
  SQLite --> Rembed
  Retrieve --> GM
  GM --> SQLite
  Loaders --> SQLite
```

- **Frontend**: React Router v7 in framework mode, Material UI, CSS Modules. Routes use loaders for data and actions for mutations; one dedicated API route for streaming GM responses.
- **Backend**: Same process (React Router server). **Single SQLite database** for all persistence: relational tables (Users, Rulesets, Worlds, Campaigns, messages) and RAG (chunk text + embeddings via **sqlite-vec** and **sqlite-rembed**).
- **RAG**: Ruleset and World documents are parsed, chunked, embedded with **sqlite-rembed** (or batched in Node for large ingestion), and stored in **sqlite-vec** virtual tables. At message time, the query is embedded with **sqlite-rembed** and similarity search runs in **sqlite-vec**; retrieved chunks are injected into the GM prompt.
- **LangGraph**: Small graph: **retrieve** (RAG via SQLite) → **gm** (LLM with system prompt + retrieved rules + campaign context + conversation). State holds `messages`; stream `messages` mode for token-by-token UI.

---

## 1. Project Setup

- **Scaffold**: Use `pnpm create react-router@latest` (or equivalent for framework mode) so you get `app/`, `app/routes.ts`, `app/root.tsx`, Vite, and React Router dev server. Use **pnpm** and **TypeScript** throughout.
- **Dependencies** (key ones):
  - React Router: `react-router`, `@react-router/dev`, `@react-router/node` (or `@react-router/vite` per template).
  - UI: `@mui/material`, `@emotion/react`, `@emotion/styled`.
  - Styling: **CSS Modules** only (no Tailwind). Use `*.module.css` next to components.
  - **Config/validation**: **zod** ([zod.dev](https://zod.dev)) — use as a core dependency to **validate environment variables on app start**. Define a schema (e.g. `envSchema`) for all env vars (required and optional with defaults); parse and validate at server startup and fail fast with clear errors if invalid.
  - Backend/DB: `better-sqlite3` for SQLite; **sqlite-vec** (npm: `sqlite-vec`) and **sqlite-rembed** (load extension from prebuilt binary or [sqlite-dist](https://github.com/asg017/sqlite-dist)).
  - RAG: **sqlite-vec** for vector storage/KNN; **sqlite-rembed** for embeddings. Embedding **client and model** are configured via environment variables (see §11); at app init, register the rembed client with **OpenAI format only** (`format`, `url`, `key`) from env.
  - LLM: `@langchain/langgraph`, `@langchain/core`, and a single chat model integration that supports **OpenAI-compatible** base URL and model name (e.g. `@langchain/openai` with `configuration.baseURL` and `configuration.model` from env). Use this for the GM so the same code works with [LM Studio](https://lmstudio.ai) (default e.g. `http://localhost:1234/v1`), [Ollama](https://ollama.com) (default `http://localhost:11434/v1`), or hosted OpenAI/Anthropic-compatible APIs.
  - File parsing: `pdf-parse` for PDF; markdown and plain text via `fs`/string handling.
- **Config**: Ensure `react-router.config.ts` and `vite.config.ts` are set for framework mode. Root layout in `app/root.tsx` with MUI `ThemeProvider` and React Router `Outlet`. **LLM and embedding provider**: read from env on server startup; **validate env with zod** on app start (see §11); no hardcoded URLs or model names.

---

## 2. Database Schema (SQLite)

**Single SQLite database** for relational data and RAG. Load **sqlite-vec** and **sqlite-rembed** extensions on connection. **Convention**: use **camelCase** for all table and column names (no snake_case). In SQL, use quoted identifiers where needed (e.g. `"userId"`, `"createdAt"`).

**Relational tables:**

| Table                | Purpose                                                                                                                                                                                                                                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **users**            | `id` (PK, uuid), `email`, `name`, `createdAt`, `updatedAt`. Optional: password hash if you add auth.                                                                                                                                                                                                                                   |
| **rulesets**         | `id` (PK, uuid), `userId` (FK), `name`, `description` (TEXT, optional), `coverImagePath` (TEXT, optional), `sourceFileName`, `createdAt`, `updatedAt`. Optional: `rawText` or path to stored file for re-chunking.                                                                                                                     |
| **worlds**           | `id` (PK, uuid), `userId` (FK), `name`, `description` (TEXT, optional), `coverImagePath` (TEXT, optional), `sourceFileName`, `createdAt`, `updatedAt`. Same optional raw/path.                                                                                                                                                         |
| **campaigns**        | `id` (PK, uuid), `userId` (FK), `rulesetId` (FK), `worldId` (FK), `name`, `coverImagePath` (TEXT, optional), `createdAt`, `updatedAt`.                                                                                                                                                                                                 |
| **characters**       | `id` (PK, uuid), `campaignId` (FK), `name`, `race`, `class` (or `className` if `class` is reserved), `description` (TEXT), `imagePath` (TEXT, optional), `skills` (TEXT/JSON), `statistics` (TEXT/JSON), `items` (TEXT/JSON), `createdAt`, `updatedAt`. A campaign has one or more characters (the party); all controlled by the user. |
| **campaignMessages** | `id` (PK, uuid), `campaignId` (FK), `role`, `content` (TEXT), `createdAt`, `updatedAt`.                                                                                                                                                                                                                                                |

**Chunk tables** (text only; embeddings live in vec0 virtual tables):

| Table             | Purpose                                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **rulesetChunks** | `id` (PK, integer, used as rowid for vec table), `rulesetId` (FK), `content` (TEXT), `sectionLabel` (TEXT, optional), `createdAt`. |
| **worldChunks**   | Same shape: `id`, `worldId`, `content`, `sectionLabel`, `createdAt`.                                                               |

**sqlite-vec virtual tables** (store embeddings; use same rowid as chunk tables for joins):

- **vecRulesetChunks**: `create virtual table vecRulesetChunks using vec0(embedding float[1536], rulesetId text)`. Insert with `rowid` = `rulesetChunks.id` so `JOIN rulesetChunks ON rulesetChunks.id = vecRulesetChunks.rowid` works. Use **auxiliary column** `rulesetId` so retrieval can filter: `WHERE embedding MATCH ? AND rulesetId = ? ORDER BY distance LIMIT k`.
- **vecWorldChunks**: Same pattern with `embedding float[1536]`, `worldId text`; rowid = `worldChunks.id`.

Embedding dimension (e.g. 1536 for `text-embedding-3-small`, or model-specific for Ollama) must match the configured embedding model. Define the dimension in env or a config module (e.g. `EMBEDDING_DIMENSION`) and use it when creating vec0 tables so the same code works with different providers.

**sqlite-rembed**: At app init, register the embedding client from **environment variables** (see §11). Always use **OpenAI format**: `rembedClientOptions('format', 'openai', 'url', <EMBEDDING_BASE_URL>, 'key', <EMBEDDING_API_KEY>)`. The client name used in `rembed(clientName, ?)` is the configured model identifier (`EMBEDDING_MODEL`). No hardcoded URLs or API keys in code.

Migrations: use a simple migration runner or raw SQL files (e.g. `migrations/001Initial.sql`, `002VecTables.sql`) and run them on app start or via a small CLI. Load sqlite-vec and sqlite-rembed before creating vec0 virtual tables.

---

## 3. File Upload and Ingestion (Rulesets and Worlds)

- **Upload UX**: Two flows—(1) “Create Ruleset”: upload one or more files (PDF, Markdown, or plain text) to merge into a single `Ruleset`. (2) “Create World”: upload one or more files (PDF, Markdown, or plain text) to merge into a single `World`. Use MUI components and CSS Modules for layout. **Name and short description** are **auto-generated** on the server after parse; show them in the UI once ready (e.g. preview or detail page); optionally allow editing before or after save. Accept document types: `.pdf`, `.md`, `.txt` (and optionally `.markdown`); accept optional **cover image**: `.jpg`, `.jpeg`, `.png`, `.webp`.
- **Server handling**: In a **route action** (e.g. `POST` to a route that handles multipart form data), or a dedicated API route:
  - Validate file types and sizes (documents + optional cover image).
  - **Parse**: PDF via `pdf-parse`; Markdown/plain text as UTF-8 string. Concatenate all uploaded document contents for the entity.
  - **Generate name and description**: From the parsed text (e.g. first ~2–4k chars), call the configured LLM with a short prompt asking for a concise **title** (a few words) and a **short description** (1–2 sentences). Use the same OpenAI-compatible client as the GM; keep the prompt small so it's fast. Store results in `name` and `description` on the new row. Fallback: derive a name from the first document's filename or first heading if LLM is unavailable.
  - **Cover image**: If an image file is provided, validate type and size (e.g. max 2–5 MB), save to a dedicated directory (e.g. `uploads/covers/` or a path derived from `DATABASE_PATH`), use a stable filename (e.g. `{rulesetId}.webp` or `{worldId}.webp`). Store the relative path in `coverImagePath`. Optionally resize or re-encode for consistent display.
  - **Chunk**: Section-aware chunking (split on `#` headers for Markdown, or double newlines) with max chars per chunk (e.g. 500–800 tokens) and optional overlap. Store `sectionLabel` per chunk.
  - **Embed and persist (SQLite-only RAG)**:
    - Insert `rulesets` or `worlds` row (with `name`, `description`, `coverImagePath`); then for each chunk insert into `rulesetChunks` or `worldChunks` and get `id`.
    - **Option A (recommended for large docs)**: In Node, call the embedding API in batches (e.g. OpenAI embeddings endpoint), then insert into the corresponding **sqlite-vec** virtual table: `INSERT INTO vecRulesetChunks(rowid, rulesetId, embedding) VALUES (?, ?, ?)` with the chunk id, parent id, and embedding as a blob (same format sqlite-vec expects; use `Float32Array` and pass `.buffer` or equivalent when binding). This avoids N sequential HTTP calls from sqlite-rembed.
    - **Option B (pure SQLite)**: Use **sqlite-rembed** in SQL with the **configured embedding client name** from env (e.g. `rembed(embeddingClientName, ?)`). One HTTP request per chunk; consider a progress indicator or background job for large files.
  - Ensure `userId` is set from session/context.
- **Idempotency**: Same file name + user could overwrite or create new version; decide whether to support “replace” or only “create new” and document it.

---

## 3b. Characters (Schema and Flows)

Characters are **playable characters** that make up the **party** for a campaign; each character is linked to a **campaign** and controlled by the user. When starting or managing a campaign, the user creates one or more characters.

**Character fields**: `name`, `race`, `class` (or `className`), `description`, `image` (optional; store path in `imagePath`), `skills`, `statistics`, `items`. Store `skills`, `statistics`, and `items` as structured TEXT/JSON so they can vary by ruleset (e.g. list of skill names, key-value stats, list of item names or objects).

**Suggested / autocomplete values**: Depending on the campaign's **Ruleset** and **World**, the app should provide **suggested, autocomplete values** when the user is creating or editing a character. Use RAG (retrieve from ruleset and world chunks) to derive suggested races, classes, skills, statistics, and inventory items that fit the current campaign. Expose these via an API or loader (e.g. `GET /api/campaigns/:campaignId/character-suggestions` or include in the character form loader) so the UI can drive autocomplete and dropdowns. The UI must **not** be rigid: allow **custom values** for all fields (free text or selection from suggestions).

**Character creation/edit view** — two ways to edit:

1. **Form**: Manually edit all fields with **Material UI** inputs (TextField, Select, Autocomplete, buttons, toggles, etc.). Use suggested values from the campaign's ruleset/world for autocomplete where appropriate; user can still type custom values.
2. **Chat with GM**: A **conversational thread** (similar to the main campaign chat) where the user describes their desired character in natural language. The **GM AI agent** asks follow-up questions as needed to produce a valid character for the current campaign's Ruleset and World. When the AI has enough information, it responds with a **suggested character** (e.g. structured JSON or a clear block). The app **updates the form view** with this suggestion as a **preview**; the user can then tweak fields in the form before saving.

**Flow**: User opens character create/edit → sees form + optional GM chat. They can fill the form only, or use the GM chat to get a suggestion and then edit in the form. When satisfied, user clicks **Submit** → save character (insert or update), add/link to campaign, **redirect to main campaign view**. New characters are created from the campaign context (e.g. "Add character" from campaign view); edit uses the same view with the character loaded.

**Implementation notes**:

- **Character-suggestions**: Retrieve chunks from the campaign's ruleset and world (same RAG as campaign chat); optionally use the LLM to extract or list races, classes, skills, stats, items from retrieved text and return structured options for the form.
- **Character GM chat**: Reuse the same LangGraph GM with a **character-creation mode** (different system prompt: "Help the player create a character; use the following rules and world context…; when ready, respond with a structured character suggestion"). Or a dedicated subgraph that retrieves rules/world context and prompts the LLM to ask follow-ups and then output a suggested character. Stream responses as in campaign chat; when the assistant message contains a character suggestion, parse it (e.g. JSON in a code block) and update the form state. Persist character-chat messages only in memory or in a separate store for the session if needed; the canonical character is saved on Submit.
- **Image**: Optional character image upload; store path in `imagePath` (same pattern as ruleset/world cover image).

---

## 4. RAG Retrieval (sqlite-vec + sqlite-rembed)

- **At campaign message time**: Given `campaignId`, load `campaign.rulesetId` and `campaign.worldId`. For the **user message** (and optionally last few turns):
  - **Embed the query** using **sqlite-rembed** in SQL: `SELECT rembed(?, ?)` with the **configured embedding client name** (from env) and the query text; bind the returned blob for the next step (one HTTP call per message).
  - **Retrieve** with **sqlite-vec** (two separate KNN queries):
    - Rules: `SELECT rowid, distance FROM vecRulesetChunks WHERE embedding MATCH ? AND rulesetId = ? ORDER BY distance LIMIT 5` (bind the query embedding blob and `rulesetId`). Join to `rulesetChunks` on `rowid` to get `content` (and optionally `sectionLabel`).
    - Campaign: `SELECT rowid, distance FROM vecWorldChunks WHERE embedding MATCH ? AND worldId = ? ORDER BY distance LIMIT 5`; join to `worldChunks` for `content`.
  - Concatenate chunk contents into “Rules context” and “Campaign context” strings for the GM prompt.
- **Retrieve node**: In the LangGraph retrieve node, run the above SQL (embed query with rembed, then two vec0 queries, then JOIN to chunk tables). No LangChain vector-store abstraction required; keep retrieval as a small function that takes `(queryText, rulesetId, worldId)` and returns `{ rulesContext, campaignContext }`. Pass these strings into the GM node.

---

## 5. LangGraph Game Master Graph (TypeScript)

- **State**: Use `StateSchema` with `messages: MessagesValue` (and optionally `campaignId`, `rulesetId`, `worldId` for retrieval). Reducer for `messages` should append.
- **Nodes**:
  1. **retrieve**: Input: last user message (and maybe recent messages). Output: `rulesContext: string`, `campaignContext: string`. Embed query with **sqlite-rembed** using the **configured embedding client name** (from env); run two **sqlite-vec** KNN queries filtered by `rulesetId` and `worldId`; join to chunk tables for content; concatenate into rules and campaign context strings.
  2. **gm**: Input: state with `messages` + `rulesContext` + `campaignContext`. Build a **system message**: “You are the Game Master. Apply these rules: …” + rulesContext + “Use this world and story: …” + campaignContext + “Respond to the player and resolve their action.” Invoke the **configurable chat model** (base URL, model name, optional API key from env—OpenAI-compatible so [LM Studio](https://lmstudio.ai) and [Ollama](https://ollama.com) work by default). Return new AI message appended to state.
- **Graph**: `START → retrieve → gm → END`. No tools required for MVP; optional later (e.g. dice, lookup).
- **Compilation**: `StateGraph(State).addNode("retrieve", retrieveNode).addNode("gm", gmNode).addEdge(START, "retrieve").addEdge("retrieve", "gm").addEdge("gm", END).compile()`.
- **Streaming**: Use `graph.stream(inputs, { streamMode: "messages" })` and, in the API route, forward token stream to the client (e.g. `ReadableStream` or SSE). Persist the full assistant message to `campaignMessages` after the stream completes.

---

## 6. API Route for Sending Messages and Streaming GM Response

- **Route**: e.g. `POST /api/campaigns/:campaignId/messages` or a resource route that accepts JSON body `{ content: string }`.
- **Flow**:
  1. Resolve campaign by `campaignId` and ensure it belongs to the current user. Load `rulesetId` and `worldId`.
  2. Load full message history for the campaign from `campaignMessages`, convert to LangChain message format.
  3. Append the new user message; persist it to `campaignMessages`.
  4. Invoke the LangGraph graph with state `{ messages }` and config that includes `campaignId`, `rulesetId`, `worldId` (or pass them in state) so the retrieve node can run RAG.
  5. Stream the graph with `streamMode: "messages"`. Pipe the stream to the HTTP response (e.g. `ReadableStream` or SSE). On the client, consume the stream and append tokens to the UI.
  6. When stream ends, take the full assistant reply from the graph final state and insert one row into `campaignMessages` (role `assistant`, content = full text).
- **Error handling**: Return 4xx/5xx with a clear body; on client show a toast or inline error.

---

## 7. Frontend Structure (React Router + MUI + CSS Modules)

- **Routes** (in `app/routes.ts`):
  - `/` — Home (list campaigns, links to rulesets and worlds).
  - `/rulesets` — List rulesets; “New Ruleset” → upload.
  - `/rulesets/:id` — Ruleset detail: show auto-generated name, description, optional cover image; optional chunk count, re-process.
  - `/worlds` — List worlds; “New World” → upload.
  - `/worlds/:id` — World detail: show auto-generated name, description, optional cover image.
  - `/campaigns` — List campaigns; “New Campaign” → select Ruleset + World, set name.
  - `/campaigns/:id` — **Campaign view**: campaign name, ruleset/world names, party (list of characters), main campaign chat (message list + input; stream tokens). Entry point to add characters and to open campaign chat.
  - `/campaigns/:id/characters/new` — **Character creation**: form (name, race, class, description, image, skills, statistics, items) with suggested/autocomplete from ruleset and world; optional character GM chat to get AI-suggested character that updates the form. Submit saves character and redirects to campaign view.
  - `/campaigns/:id/characters/:characterId` — **Character edit**: same as creation with character loaded; form + optional character GM chat; Submit updates and redirects to campaign view.
- **Data**: Use **loaders** for list and detail pages (read from SQLite: include `name`, `description`, `coverImagePath` for rulesets, worlds, and campaigns). Use **actions** for: create ruleset/world (upload documents + optional cover image; server returns or redirects with auto-generated name/description). List views show name, short description, and cover thumbnail where present. Use **fetch** for: campaign chat stream (`POST .../messages`), character GM chat stream (e.g. `POST .../characters/chat`), and character-suggestions (loader or `GET .../character-suggestions`). Loaders for campaign view include campaign + characters + messages; for character form include suggested values from ruleset/world. Actions: create/update character (form submit).
- **Styling**: One CSS Module per route or component (e.g. `CampaignChat.module.css`). Use MUI for components (Button, TextField, Card, List, AppBar, etc.) and override or compose with class names from CSS Modules where needed. **Do not use Tailwind.**

---

## 8. Campaign Chat UI (Detail)

- **Layout**: MUI `Box`/`Paper` for message list; sticky input at bottom. Message bubbles: user vs assistant; assistant messages support streaming (append tokens to the last message until stream ends).
- **State**: When user submits: (1) Optimistically append user message to UI, (2) POST to streaming endpoint, (3) Create a placeholder assistant message and append streamed tokens to it, (4) On stream end, replace placeholder with final message (and optionally refetch from server to sync with DB).
- **Accessibility**: Focus management, aria-labels for input and send button.

---

## 9. Authentication and Multi-User (Minimal)

- **User**: At least one row in `users`. For MVP, either single-user (one default user) or simple session auth (e.g. cookie with `userId`). All loaders/actions and the streaming API must resolve `userId` and filter rulesets, worlds, and campaigns by it.
- **Middleware**: Optional React Router **middleware** to require auth and set `context.user` for loaders/actions. If no auth, use a fixed `userId` in dev.

---

## 10. Key Files to Add (Suggested)

| Area       | Files                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Config     | `server/config/env.ts` — zod schema for all env vars; validate on app start; export typed config. Optionally `server/config/llm.ts` and `server/config/embedding.ts` that consume validated env and export base URL, model name, API key, embedding client name, dimension, and rembed registration options. No defaults hardcoded in business logic.                                                                         |
| DB         | `server/db/schema.sql`, `server/db/index.ts` (connection + query helpers, load extensions using config), `server/db/migrations.ts`                                                                                                                                                                                                                                                                                            |
| RAG        | `server/rag/chunk.ts` (section-aware chunking), `server/rag/retrieve.ts` (embed query via rembed + sqlite-vec KNN + join chunk tables; use config for client name). `server/db/vec.ts` (load sqlite-vec + sqlite-rembed, register rembed client from config, create vec0 tables with config dimension, insert/query helpers). Optional: `server/rag/embed.ts` if using Node batch embedding for ingestion.                    |
| LangGraph  | `server/gm/graph.ts` (state + nodes + compile), `server/gm/nodes/retrieve.ts`, `server/gm/nodes/gm.ts`                                                                                                                                                                                                                                                                                                                        |
| API        | `app/routes/api.campaigns.$campaignId.messages.ts` (POST: campaign chat, stream). Optional: `api.campaigns.$campaignId.characters.chat.ts` (POST: character-creation GM chat, stream) and `api.campaigns.$campaignId.character-suggestions.ts` (GET: suggested races, classes, skills, stats, items from RAG) or fold suggestions into character form loader.                                                                 |
| Upload     | `app/routes/rulesets.new.tsx` (action: parse, chunk, embed, save), `app/routes/worlds.new.tsx`                                                                                                                                                                                                                                                                                                                                |
| Chat       | `app/routes/campaigns.$id.tsx` (loader: campaign + characters + messages), `app/components/CampaignChat.tsx`, `app/components/MessageList.tsx`                                                                                                                                                                                                                                                                                |
| Characters | `app/routes/campaigns.$id.characters.new.tsx`, `app/routes/campaigns.$id.characters.$characterId.tsx` (create/edit). `app/components/CharacterForm.tsx` (MUI form with autocomplete/suggestions), `app/components/CharacterCreationChat.tsx` (GM chat thread for character suggestion; on suggested character, update form preview). Optional: `server/gm/characterGraph.ts` or mode in main graph for character-creation GM. |
| Styles     | `app/components/*.module.css` next to components                                                                                                                                                                                                                                                                                                                                                                              |

---

## 11. Environment and Secrets (Configurable LLM and Embeddings)

All LLM and embedding behavior MUST be driven by environment variables. No hardcoded API URLs, model names, or provider logic. Defaults should support **local** [LM Studio](https://lmstudio.ai) and [Ollama](https://ollama.com) (OpenAI-compatible endpoints). **Validate all env on app start** using **zod**: define a single env schema (e.g. in `server/config/env.ts`) that parses and validates required/optional vars; call it before opening DB or registering rembed so the process fails fast with clear validation errors if env is missing or invalid.

**Database**

| Variable                | Purpose                                                             | Example            |
| ----------------------- | ------------------------------------------------------------------- | ------------------ |
| `DATABASE_PATH`         | SQLite file path                                                    | `./data/gm.sqlite` |
| `REMBED_EXTENSION_PATH` | Path to sqlite-rembed extension binary (optional if on system path) | `./ext/rembed0`    |

**LLM (chat model for GM)**  
Use a single OpenAI-compatible client (e.g. LangChain `ChatOpenAI` with `baseURL` and `model`). Read from env:

| Variable       | Purpose                                            | Default (local)                                                                | Example (hosted)            |
| -------------- | -------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------- |
| `LLM_BASE_URL` | OpenAI-compatible API base URL (no trailing slash) | `http://localhost:1234/v1` (LM Studio) or `http://localhost:11434/v1` (Ollama) | `https://api.openai.com/v1` |
| `LLM_MODEL`    | Model name                                         | `llama3.2` (Ollama) or whatever is loaded in LM Studio, e.g. `local-model`     | `gpt-4o`                    |
| `LLM_API_KEY`  | API key (optional for local LM Studio/Ollama)      | (empty)                                                                        | `sk-...`                    |

Implementation: one config module (e.g. `server/config/llm.ts`) that reads these and returns options for the chat model constructor. Default `LLM_BASE_URL` can be chosen by convention (e.g. prefer LM Studio port 1234 if nothing set) or document both in README and require the user to set one.

**Embeddings (sqlite-rembed)**  
Register the rembed client at app init from env. Always use OpenAI-standard format (no provider branching): register with `rembedClientOptions('format', 'openai', 'url', EMBEDDING_BASE_URL, 'key', EMBEDDING_API_KEY)`.

| Variable              | Purpose                                   | Default (local)                          | Example (hosted)            |
| --------------------- | ----------------------------------------- | ---------------------------------------- | --------------------------- |
| `EMBEDDING_MODEL`     | Model name (rembed client identifier)     | `text-embedding-embeddinggemma-300m-qat` | `text-embedding-3-small`    |
| `EMBEDDING_BASE_URL`  | OpenAI-compatible embeddings API base URL | `http://localhost:1234/v1` (LM Studio)   | `https://api.openai.com/v1` |
| `EMBEDDING_API_KEY`   | API key (optional for local endpoints)    | (empty)                                  | `sk-...`                    |
| `EMBEDDING_DIMENSION` | Vector size for vec0 schema               | `1536`                                   | `1536`                      |

Implementation: at DB/rembed init, register the client with `INSERT INTO temp.rembed_clients(name, options) VALUES (EMBEDDING_MODEL, rembedClientOptions('format', 'openai', 'url', EMBEDDING_BASE_URL, 'key', EMBEDDING_API_KEY))`. Use `EMBEDDING_MODEL` as the client name in `rembed(EMBEDDING_MODEL, ?)`. Create vec0 tables with `float[EMBEDDING_DIMENSION]`.

**Documentation**: Provide an `.env.example` with the above variables and short comments. README should describe using any OpenAI-compatible embeddings endpoint (LM Studio, OpenAI, or other) via `EMBEDDING_BASE_URL` and `EMBEDDING_API_KEY`. No secrets in repo; use `.env` (gitignored) and document in README.

---

## 12. Optional Enhancements (Post-MVP)

- **Tools in LangGraph**: e.g. “roll dice” (random number), “look up rule” (targeted RAG). Add a tool-calling node and conditional edge from GM.
- **Re-ingestion**: Replace or re-chunk a ruleset/world and re-embed (e.g. button “Reprocess”).
- **Section labels in UI**: Show which rule sections were retrieved for the last reply (debug/transparency).
- **AI image generation**: Generate images with AI based on descriptions for: ruleset covers, world covers, characters,
- **Multiple files per World**: Merge or tag chunks by source file for retrieval.

---

## Summary

- **Stack**: TypeScript, pnpm, React Router (framework mode), CSS Modules, MUI, LangGraph (TS), **single SQLite** for all data: relational tables + **sqlite-vec** (vectors/KNN) + **sqlite-rembed** (text embeddings).
- **Schema**: User → Ruleset, World; User → Campaign (with rulesetId, worldId); Campaign → **characters** (party) and campaignMessages. Chunk text in `rulesetChunks` / `worldChunks`; embeddings in **sqlite-vec** virtual tables (dimension from `EMBEDDING_DIMENSION`). Query embedding via **sqlite-rembed** with client name and OpenAI-format url/key from env.
- **Configurable providers**: LLM and embeddings are fully configurable via env (§11). Defaults target local OpenAI-compatible servers: [LM Studio](https://lmstudio.ai) and [Ollama](https://ollama.com).
- **Flows**: Upload file → parse → chunk → embed (rembed in SQL or batched in Node) → insert into chunk tables + vec0 tables; Create campaign → select ruleset + world; Send message → embed query (rembed) → sqlite-vec KNN → join chunks → LangGraph (retrieve → gm) → stream response → persist.
- **Streaming**: One API route for `POST .../messages` that runs the graph with `streamMode: "messages"` and pipes the token stream to the client; front-end appends tokens to the current assistant message in the UI.
