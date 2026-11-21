# Agent1o1

Frontend for Agent1o1, the platform for building AI agents and automated workflows.

Built with React 19, TypeScript, Vite and Tailwind CSS 4. It talks to the Laravel API (`agent-1o1-ai`).

## Setup

```bash
yarn install
cp .env.example .env
yarn dev
```

`.env` settings:

| Variable                                                                            | Purpose                                        |
| ----------------------------------------------------------------------------------- | ---------------------------------------------- |
| `VITE_API_URL`                                                                      | Base URL of the API, including `/api/v1`       |
| `VITE_API_TIMEOUT`                                                                  | Request timeout in milliseconds                |
| `VITE_REVERB_APP_KEY`, `VITE_REVERB_HOST`, `VITE_REVERB_PORT`, `VITE_REVERB_SCHEME` | Laravel Reverb connection for realtime updates |

## Scripts

| Command                       | What it does                                                          |
| ----------------------------- | --------------------------------------------------------------------- |
| `yarn dev`                    | Start the dev server                                                  |
| `yarn build`                  | Type-check and build to `build/`                                      |
| `yarn preview`                | Serve the production build                                            |
| `yarn lint` / `yarn lint:fix` | Run ESLint                                                            |
| `yarn prettier:fix`           | Format with Prettier                                                  |
| `yarn icons:used`             | Regenerate `src/components/icon/huge/used.ts` after adding a Hugeicon |
| `yarn icon`                   | Turn the SVGs in `SvgIcons/` into icon components                     |

## Project structure

```
src
├── api          API client and per-resource query hooks
├── components   Shared UI, layout, form and icon components
├── config       Theme and default brand config
├── context      Auth, workspace, theme, realtime and brand providers
├── layouts      App shells
├── pages        Route pages (coreapp, identity, settings, welcome)
├── Routes       Page registry, path builders and router
├── store        Zustand stores
├── templates    Asides, search and other app-wide parts
└── types        Shared types
```

## Deployment

Deployed as a Cloudflare Worker that serves the static build (`build/`). `wrangler.jsonc` sends every
route to `index.html` so client-side routing works, and Cloudflare applies the `build/_headers` file
(security headers) on its own.

Build command: `yarn build`. Deploy command: `npx wrangler deploy`.

Set the `VITE_*` values from `.env.example` as build variables, not runtime ones. `VITE_API_URL` is
required (for example `https://api.agent1o1.io/api/v1`); the app refuses to start without it.

`netlify.toml` and `netlify/edge-functions/page-meta.ts` are kept for the shared-page link previews
(`/p/{token}`), which are not running on Cloudflare yet. Until they are, a pasted page link shows the
generic Agent1o1 card.
