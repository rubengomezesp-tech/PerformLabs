# Skills del proyecto (`.claude/skills/`)

Skills disponibles para los agentes de Claude Code **en cualquier sesión** (local o
remota) que clone este repo. Claude Code las autodescubre por su `SKILL.md`.

> Excluidas del tooling del producto (ver `tsconfig.json` → `exclude: [".claude"]`), así
> que **no afectan** a `pnpm typecheck` / `build` / `lint`.

## Qué hay aquí (31)

- **Desarrollo / workflow / cognición (obra/superpowers):** brainstorming, writing-plans,
  executing-plans, subagent-driven-development, dispatching-parallel-agents,
  systematic-debugging, test-driven-development, verification-before-completion,
  using-git-worktrees, finishing-a-development-branch, requesting-code-review,
  receiving-code-review, writing-skills, using-superpowers.
- **Diseño / contenido:** frontend-design, theme-factory, brand-guidelines,
  algorithmic-art, canvas-design, web-artifacts-builder, slack-gif-creator.
- **Office / docs:** docx, pdf, pptx, xlsx, pdf-reading, file-reading, doc-coauthoring,
  internal-comms.
- **Extensión:** mcp-builder, skill-creator.

Atribución de licencia de superpowers en `LICENSE-superpowers`.

## Qué falta (de las 79 instaladas en el Mac del CEO)

El resto (familia `baoyu-*`, `ui-ux-pro-max`, `react-best-practices`, `react-native-skills`,
`composition-patterns`, `supabase-postgres-best-practices`, `web-design-guidelines`,
`memory-systems`, `context-*`, etc.) vive en **otros repos/marketplaces** que no son
alcanzables desde el entorno remoto. Para tenerlas también aquí:

1. En el Mac, copia esas carpetas de skills a `.claude/skills/` de este repo.
2. `git add .claude/skills && git commit && git push`.

A partir del siguiente arranque de sesión, los agentes las verán.

> Nota: muchas de estas capacidades ya están cubiertas por **MCPs conectados**
> (`ui-ux-pro` ≈ ui-ux-pro-max, Supabase ≈ supabase-postgres-best-practices, GitHub,
> Vercel, Stripe…), que sí funcionan en remoto.
