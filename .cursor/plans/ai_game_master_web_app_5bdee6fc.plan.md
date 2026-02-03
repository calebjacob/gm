---
name: AI Game Master Web App
overview: Build a full-stack AI Game Master (Dungeon Master) web app with React Router (framework mode), Material UI, CSS Modules, LangGraph (TypeScript), SQLite for relational data, and a RAG pipeline for rules and campaign content. Users upload rules and campaign template files, create campaigns from them, and converse with an AI GM that resolves actions using retrieved context.
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
  subgraph sqlite_ext [SQLite Extensions]
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
- **Backend**: Same process (React Router server). **Single SQLite database** for all persistence: relational tables (Users, Rulesets, CampaignTemplates, Campaigns, messages) and RAG (chunk text + embeddings via **sqlite-vec** and **sqlite-rembed**).
- **RAG**: Ruleset and CampaignTemplate documents are parsed, chunked, embedded with **sqlite-rembed** (or batched in Node for large ingestion), and stored in **sqlite-vec** virtual tables. At message time, the query is embedded with **sqlite-rembed** and similarity search runs in **sqlite-vec**; retrieved chunks are injected into the GM prompt.
- **LangGraph**: Small graph: **retrieve** (RAG via SQLite) → **gm** (LLM with system prompt + retrieved rules + campaign context + conversation). State holds `messages`; stream `messages` mode for token-by-token UI.

---

## 1. Project Setup

- **Scaffold**: Use `pnpm create react-router@latest` (or equivalent for framework mode) so you get `app/`, `app/routes.ts`, `app/root.tsx`, Vite, and React Router dev server. Use **pnpm** and **TypeScript** throughout.
- **Dependencies** (key ones):
  - React Router: `react-router`, `@react-router/dev`, `@react-router/node` (or `@react-router/vite` per template).
  - UI: `@mui/material`, `@emotion/react`, `@emotion/styled`.
  - Styling: **CSS Modules** only (no Tailwind). Use `*.module.css` next to components.
  - Backend/DB: `better-sqlite3` for SQLite; **sqlite-vec** (npm: `sqlite-vec`) and **sqlite-rembed** (load extension from prebuilt binary or [sqlite-dist](https://github.com/asg017/sqlite-dist)).
  - RAG: **sqlite-vec** ([github.com/asg017/sqlite-vec](https://github.com/asg017/sqlite-vec)) for vector storage and KNN search—install via `npm install sqlite-vec`, load with `sqliteVec.load(db)` (compatible with better-sqlite3). **sqlite-rembed** ([github.com/asg017/sqlite-rembed](https://github.com/asg017/sqlite-rembed)) for text embeddings via remote APIs (OpenAI, Nomic, Ollama, etc.)—load the extension binary (e.g. from [sqlite-dist](https://github.com/asg017/sqlite-dist) or build from source) with `db.loadExtension('path/to/rembed0')`. Register embedding client once: `INSERT INTO temp.rembed_clients(name, options) VALUES ('text-embedding-3-small', 'openai')` (requires `OPENAI_API_KEY`).
  - LLM: `@langchain/langgraph`, `@langchain/core`, `@langchain/openai` (or `@langchain/anthropic`) for the GM chat model only.
  - File parsing: `pdf-parse` for PDF; markdown and plain text via `fs`/string handling.
- **Config**: Ensure `react-router.config.ts` and `vite.config.ts` are set for framework mode (server-side loaders/actions). Root layout in `app/root.tsx` with MUI `ThemeProvider` and React Router `Outlet`.

---

## 2. Database Schema (SQLite)

**Single SQLite database** for relational data and RAG. Load **sqlite-vec** and **sqlite-rembed** extensions on connection.

**Relational tables:**

| Table                  | Purpose                                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **users**              | `id` (PK, uuid), `email`, `name`, `created_at`. Optional: password hash if you add auth.                                                |
| **rulesets**           | `id` (PK, uuid), `user_id` (FK), `name`, `source_file_name`, `created_at`. Optional: `raw_text` or path to stored file for re-chunking. |
| **campaign_templates** | `id` (PK, uuid), `user_id` (FK), `name`, `source_file_name`, `created_at`. Same optional raw/path.                                      |
| **campaigns**          | `id` (PK, uuid), `user_id` (FK), `ruleset_id` (FK), `campaign_template_id` (FK), `title`, `created_at`, `updated_at`.                   |
| **campaign_messages**  | `id` (PK, uuid), `campaign_id` (FK), `role`, `content` (TEXT), `created_at`.                                                            |

**Chunk tables** (text only; embeddings live in vec0 virtual tables):

| Table                        | Purpose                                                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **ruleset_chunks**           | `id` (PK, integer, used as rowid for vec table), `ruleset_id` (FK), `content` (TEXT), `section_label` (TEXT, optional), `created_at`. |
| **campaign_template_chunks** | Same shape: `id`, `campaign_template_id`, `content`, `section_label`, `created_at`.                                                   |

**sqlite-vec virtual tables** (store embeddings; use same rowid as chunk tables for joins):

- **vec_ruleset_chunks**: `create virtual table vec_ruleset_chunks using vec0(embedding float[1536], ruleset_id text)`. Insert with `rowid` = `ruleset_chunks.id` so `JOIN ruleset_chunks ON ruleset_chunks.id = vec_ruleset_chunks.rowid` works. Use **auxiliary column** `ruleset_id` so retrieval can filter: `WHERE embedding MATCH ? AND ruleset_id = ? ORDER BY distance LIMIT k`.
- **vec_campaign_template_chunks**: Same pattern with `embedding float[1536]`, `campaign_template_id text`; rowid = `campaign_template_chunks.id`.

Embedding dimension (e.g. 1536) must match the **sqlite-rembed** client (e.g. OpenAI `text-embedding-3-small`). Use that dimension in the vec0 schema.

**sqlite-rembed**: Run once at app init (or in a migration): `INSERT INTO temp.rembed_clients(name, options) VALUES ('text-embedding-3-small', 'openai')` so `rembed('text-embedding-3-small', ?)` can be used in SQL. Set `OPENAI_API_KEY` in the environment.

Migrations: use a simple migration runner or raw SQL files (e.g. `migrations/001_initial.sql`, `002_vec_tables.sql`) and run them on app start or via a small CLI. Load sqlite-vec and sqlite-rembed before creating vec0 virtual tables.

---

## 3. File Upload and Ingestion (Rulesets and Campaign Templates)

- **Upload UX**: Two flows—(1) “Create Ruleset”: upload one or more files (PDF, Markdown, or plain text) to merge into a single `Ruleset`. (2) “Create Campaign Template”: upload one or more files (PDF, Markdown, or plain text) to merge into a single `CampaignTemplate`. Use MUI components and CSS Modules for layout. Accept types: `.pdf`, `.md`, `.txt` (and optionally `.markdown`).
- **Server handling**: In a **route action** (e.g. `POST` to a route that handles multipart form data), or a dedicated API route:
  - Validate file type and size.
  - **Parse**: PDF via `pdf-parse`; Markdown/plain text as UTF-8 string.
  - **Chunk**: Section-aware chunking (split on `#` headers for Markdown, or double newlines) with max chars per chunk (e.g. 500–800 tokens) and optional overlap. Store `section_label` per chunk.
  - **Embed and persist (SQLite-only RAG)**:
    - Insert `rulesets` or `campaign_templates` row; then for each chunk insert into `ruleset_chunks` or `campaign_template_chunks` and get `id`.
    - **Option A (recommended for large docs)**: In Node, call the embedding API in batches (e.g. OpenAI embeddings endpoint), then insert into the corresponding **sqlite-vec** virtual table: `INSERT INTO vec_ruleset_chunks(rowid, ruleset_id, embedding) VALUES (?, ?, ?)` with the chunk id, parent id, and embedding as a blob (same format sqlite-vec expects; use `Float32Array` and pass `.buffer` or equivalent when binding). This avoids N sequential HTTP calls from sqlite-rembed.
    - **Option B (pure SQLite)**: Use **sqlite-rembed** in SQL: for each chunk run `INSERT INTO vec_ruleset_chunks(rowid, ruleset_id, embedding) SELECT ?, ?, rembed('text-embedding-3-small', ?)` (one HTTP request per chunk; no batch support in rembed yet). Consider a progress indicator or background job for large files.
  - Ensure `user_id` is set from session/context.
- **Idempotency**: Same file name + user could overwrite or create new version; decide whether to support “replace” or only “create new” and document it.

---

## 4. RAG Retrieval (sqlite-vec + sqlite-rembed)

- **At campaign message time**: Given `campaign_id`, load `campaign.ruleset_id` and `campaign.campaign_template_id`. For the **user message** (and optionally last few turns):
  - **Embed the query** using **sqlite-rembed** in SQL: `SELECT rembed('text-embedding-3-small', ?)` with the query text; bind the returned blob for the next step (one HTTP call per message).
  - **Retrieve** with **sqlite-vec** (two separate KNN queries):
    - Rules: `SELECT rowid, distance FROM vec_ruleset_chunks WHERE embedding MATCH ? AND ruleset_id = ? ORDER BY distance LIMIT 5` (bind the query embedding blob and `ruleset_id`). Join to `ruleset_chunks` on `rowid` to get `content` (and optionally `section_label`).
    - Campaign: `SELECT rowid, distance FROM vec_campaign_template_chunks WHERE embedding MATCH ? AND campaign_template_id = ? ORDER BY distance LIMIT 5`; join to `campaign_template_chunks` for `content`.
  - Concatenate chunk contents into “Rules context” and “Campaign context” strings for the GM prompt.
- **Retrieve node**: In the LangGraph retrieve node, run the above SQL (embed query with rembed, then two vec0 queries, then JOIN to chunk tables). No LangChain vector-store abstraction required; keep retrieval as a small function that takes `(queryText, rulesetId, campaignTemplateId)` and returns `{ rulesContext, campaignContext }`. Pass these strings into the GM node.

---

## 5. LangGraph Game Master Graph (TypeScript)

- **State**: Use `StateSchema` with `messages: MessagesValue` (and optionally `campaignId`, `rulesetId`, `campaignTemplateId` for retrieval). Reducer for `messages` should append.
- **Nodes**:
  1. **retrieve**: Input: last user message (and maybe recent messages). Output: `rulesContext: string`, `campaignContext: string`. Embed query with **sqlite-rembed** `rembed('text-embedding-3-small', query)`; run two **sqlite-vec** KNN queries filtered by `ruleset_id` and `campaign_template_id`; join to chunk tables for content; concatenate into rules and campaign context strings.
  2. **gm**: Input: state with `messages` + `rulesContext` + `campaignContext`. Build a **system message**: “You are the Game Master. Apply these rules: …” + rulesContext + “Use this world and story: …” + campaignContext + “Respond to the player and resolve their action.” Then invoke the chat model with `[systemMessage, ...state.messages]`. Return new AI message appended to state.
- **Graph**: `START → retrieve → gm → END`. No tools required for MVP; optional later (e.g. dice, lookup).
- **Compilation**: `StateGraph(State).addNode("retrieve", retrieveNode).addNode("gm", gmNode).addEdge(START, "retrieve").addEdge("retrieve", "gm").addEdge("gm", END).compile()`.
- **Streaming**: Use `graph.stream(inputs, { streamMode: "messages" })` and, in the API route, forward token stream to the client (e.g. `ReadableStream` or SSE). Persist the full assistant message to `campaign_messages` after the stream completes.

---

## 6. API Route for Sending Messages and Streaming GM Response

- **Route**: e.g. `POST /api/campaigns/:campaignId/messages` or a resource route that accepts JSON body `{ content: string }`.
- **Flow**:
  1. Resolve campaign by `campaignId` and ensure it belongs to the current user. Load `ruleset_id` and `campaign_template_id`.
  2. Load full message history for the campaign from `campaign_messages`, convert to LangChain message format.
  3. Append the new user message; persist it to `campaign_messages`.
  4. Invoke the LangGraph graph with state `{ messages }` and config that includes `campaignId`, `rulesetId`, `campaignTemplateId` (or pass them in state) so the retrieve node can run RAG.
  5. Stream the graph with `streamMode: "messages"`. Pipe the stream to the HTTP response (e.g. `ReadableStream` or SSE). On the client, consume the stream and append tokens to the UI.
  6. When stream ends, take the full assistant reply from the graph final state and insert one row into `campaign_messages` (role `assistant`, content = full text).
- **Error handling**: Return 4xx/5xx with a clear body; on client show a toast or inline error.

---

## 7. Frontend Structure (React Router + MUI + CSS Modules)

- **Routes** (in `app/routes.ts`):
  - `/` — Home (list campaigns, links to rulesets and templates).
  - `/rulesets` — List rulesets; “New Ruleset” → upload.
  - `/rulesets/:id` — Ruleset detail (optional: show chunk count, re-process).
  - `/templates` — List campaign templates; “New Template” → upload.
  - `/templates/:id` — Template detail.
  - `/campaigns` — List campaigns; “New Campaign” → select Ruleset + Template, set title.
  - `/campaigns/:id` — **Campaign chat**: left sidebar (optional) or top bar with campaign title, ruleset/template names; main area = message list + input; stream tokens into the latest assistant message.
- **Data**: Use **loaders** for list and detail pages (read from SQLite in loaders). Use **actions** for: create ruleset/template (upload), create campaign, and optionally delete. Use **fetch** (or `useFetcher`) to `POST /api/campaigns/:campaignId/messages` and consume the stream for sending a message.
- **Styling**: One CSS Module per route or component (e.g. `CampaignChat.module.css`). Use MUI for components (Button, TextField, Card, List, AppBar, etc.) and override or compose with class names from CSS Modules where needed. **Do not use Tailwind.**

---

## 8. Campaign Chat UI (Detail)

- **Layout**: MUI `Box`/`Paper` for message list; sticky input at bottom. Message bubbles: user vs assistant; assistant messages support streaming (append tokens to the last message until stream ends).
- **State**: When user submits: (1) Optimistically append user message to UI, (2) POST to streaming endpoint, (3) Create a placeholder assistant message and append streamed tokens to it, (4) On stream end, replace placeholder with final message (and optionally refetch from server to sync with DB).
- **Accessibility**: Focus management, aria-labels for input and send button.

---

## 9. Authentication and Multi-User (Minimal)

- **User**: At least one row in `users`. For MVP, either single-user (one default user) or simple session auth (e.g. cookie with `user_id`). All loaders/actions and the streaming API must resolve `user_id` and filter rulesets, templates, and campaigns by it.
- **Middleware**: Optional React Router **middleware** to require auth and set `context.user` for loaders/actions. If no auth, use a fixed `user_id` in dev.

---

## 10. Key Files to Add (Suggested)

| Area      | Files                                                                                                                                                                                                                                                                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DB        | `server/db/schema.sql`, `server/db/index.ts` (connection + query helpers), `server/db/migrations.ts`                                                                                                                                                                                                                                     |
| RAG       | `server/rag/chunk.ts` (section-aware chunking), `server/rag/retrieve.ts` (embed query via rembed + sqlite-vec KNN + join chunk tables), `server/db/vec.ts` (load sqlite-vec + sqlite-rembed, create vec0 tables, insert/query helpers). Optional: `server/rag/embed.ts` if using Node batch embedding for ingestion instead of rembed(). |
| LangGraph | `server/gm/graph.ts` (state + nodes + compile), `server/gm/nodes/retrieve.ts`, `server/gm/nodes/gm.ts`                                                                                                                                                                                                                                   |
| API       | `app/routes/api.campaigns.$campaignId.messages.ts` (or similar) — POST handler that runs graph and streams                                                                                                                                                                                                                               |
| Upload    | `app/routes/rulesets.new.tsx` (action: parse, chunk, embed, save), `app/routes/templates.new.tsx`                                                                                                                                                                                                                                        |
| Chat      | `app/routes/campaigns.$id.tsx` (loader: campaign + messages), `app/components/CampaignChat.tsx`, `app/components/MessageList.tsx`                                                                                                                                                                                                        |
| Styles    | `app/components/*.module.css` next to components                                                                                                                                                                                                                                                                                         |

---

## 11. Environment and Secrets

- **Env**: `DATABASE_PATH` (SQLite file), `OPENAI_API_KEY` (for sqlite-rembed and/or LLM), `ANTHROPIC_API_KEY` if using Anthropic for the GM. Path to sqlite-rembed extension binary if not using a system path (e.g. `REMBED_EXTENSION_PATH`). No secrets in repo; use `.env` and document in README.

---

## 12. Optional Enhancements (Post-MVP)

- **Tools in LangGraph**: e.g. “roll dice” (random number), “look up rule” (targeted RAG). Add a tool-calling node and conditional edge from GM.
- **Re-ingestion**: Replace or re-chunk a ruleset/template and re-embed (e.g. button “Reprocess”).
- **Section labels in UI**: Show which rule sections were retrieved for the last reply (debug/transparency).
- **Multiple files per CampaignTemplate**: Merge or tag chunks by source file for retrieval.

---

## Summary

- **Stack**: TypeScript, pnpm, React Router (framework mode), CSS Modules, MUI, LangGraph (TS), **single SQLite** for all data: relational tables + **sqlite-vec** (vectors/KNN) + **sqlite-rembed** (text embeddings).
- **Schema**: User → Ruleset, CampaignTemplate; User → Campaign (with ruleset_id, campaign_template_id); Campaign → campaign_messages. Chunk text in `ruleset_chunks` / `campaign_template_chunks`; embeddings in **sqlite-vec** virtual tables `vec_ruleset_chunks`, `vec_campaign_template_chunks` with auxiliary columns for parent id. Query embedding via **sqlite-rembed** `rembed('text-embedding-3-small', query)`.
- **Flows**: Upload file → parse → chunk → embed (rembed in SQL or batched in Node) → insert into chunk tables + vec0 tables; Create campaign → select ruleset + template; Send message → embed query (rembed) → sqlite-vec KNN → join chunks → LangGraph (retrieve → gm) → stream response → persist.
- **Streaming**: One API route for `POST .../messages` that runs the graph with `streamMode: "messages"` and pipes the token stream to the client; front-end appends tokens to the current assistant message in the UI.
