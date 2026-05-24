# DevPilotX Panel

A self-hosted, modern web panel for managing Minecraft servers — built solo with Next.js 14, TypeScript, and an embedded xterm.js console.

> Operate the server from any browser: live console, RCON command, file editor, scheduled tasks, and player ops.

---

## Why

Existing Minecraft panels (Pterodactyl, Crafty) are heavy, multi-tenant, and assume a hosting-provider use case. This panel is the opposite: one operator, one box, one server, fast UI, no daemon zoo.

## Tech stack

- **Framework:** Next.js `14.2.21` (App Router, Edge Middleware)
- **Language:** TypeScript `^5.7.3`
- **UI:** React `^18.3.1`, Radix UI primitives (dialog, dropdown, tabs, popover, select, switch, tooltip, accordion, checkbox), Tailwind `^3.4.17`, `class-variance-authority`, `lucide-react`, `framer-motion`, `next-themes`
- **State / data:** `@tanstack/react-query` `^5.62`, `zustand` `^5`, `react-hook-form` `^7.54` + `zod` `^3.24` validation
- **Console / terminal:** `@xterm/xterm` `^5.5` with `fit`, `search`, and `web-links` addons
- **Editor:** `@monaco-editor/react` `^4.6` for in-browser file editing
- **Charts:** `recharts` `^2.15` for resource usage graphs
- **RCON:** `rcon-client` `^4.2` for live command execution
- **Auth:** JWT via `jose` `^5.2`, HTTP-only `dpx-session` cookie, edge middleware route guards
- **HTTP:** `axios` `^1.7`
- **Misc:** `cronstrue` (human-readable schedules), `date-fns`, `sonner` (toasts), `react-markdown` + `remark-gfm`

## Architecture

```
Minecraft-server-panel/
├─ app/
│  ├─ (auth)/          # Login flow
│  ├─ (dashboard)/     # Protected app — console, files, players, schedules, settings
│  ├─ api/             # Server actions and route handlers
│  ├─ layout.tsx
│  └─ globals.css
├─ components/          # Shared Radix-based primitives
├─ hooks/               # Client hooks (useServer, useConsole, etc.)
├─ lib/                 # Auth, RCON wrapper, helpers
├─ types/               # Shared TS types
├─ middleware.ts        # Edge auth guard
├─ next.config.js
└─ tailwind.config.ts
```

### Auth

Edge middleware (`middleware.ts`) checks the `dpx-session` cookie. Unauthenticated users are redirected to `/login?redirect=<original_path>`. API routes, `_next/*`, and static assets are bypassed. Sessions are signed with `jose`.

## Quickstart

```bash
# Requirements: Node 20+, pnpm 9.15+, a Minecraft server with RCON enabled
git clone https://github.com/devpilotX/Minecraft-server-panel.git
cd Minecraft-server-panel
pnpm install
pnpm dev           # http://localhost:3001
```

Production:

```bash
pnpm build
pnpm start         # serves on port 3001
```

## Scripts

- `pnpm dev` — dev server on `:3001`
- `pnpm build` — production build
- `pnpm start` — start production server on `:3001`
- `pnpm lint` / `pnpm lint:fix` — ESLint
- `pnpm format` / `pnpm format:check` — Prettier
- `pnpm typecheck` — `tsc --noEmit`

Husky + lint-staged auto-run ESLint and Prettier on `*.{ts,tsx,json,css,md}` pre-commit.

## Status

Version `1.1.0` — private build, actively iterated. Not published to npm or Docker Hub yet.

## Roadmap

- Multi-server support behind a single panel
- Backups + scheduled snapshots UI
- Plugin / mod browser (CurseForge, Modrinth)
- Public Docker image
- Optional Pterodactyl daemon adapter for users who already run wings

## Author

**Dipanshu Kumar** — independent AI / full-stack engineer, shipping consumer + finance + infra tools solo.

- Sites: [paisareality.com](https://paisareality.com) · [value.codes](https://value.codes) · [algo.devpilotx.com](https://algo.devpilotx.com)
- GitHub: [@devpilotX](https://github.com/devpilotX)
- Email: connect.dipanshukumar@gmail.com

## License

Proprietary — `private: true` in `package.json`. All rights reserved.
