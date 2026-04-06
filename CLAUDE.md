# CLAUDE.md — Code-Style & Agent Guidelines

This file describes the conventions every agent (human or AI) **must** follow when
working in this repository. Read it before writing a single line of code.

---

## Package management

- **Always** use `pnpm add <pkg>` / `pnpm add -D <pkg>` to install packages.
- **Never** edit `package.json` by hand, except to add or update `scripts` entries
  via `pnpm pkg set scripts.<name>="<command>"`.
- Never use `npm` or `yarn`; this project enforces pnpm as the sole package manager.

---

## TypeScript — zero-tolerance rules

| Rule | Required action |
|------|----------------|
| `any` type | **Forbidden.** Use `unknown` and narrow, or create a proper interface. |
| Type errors | **Never ignore.** Fix the root cause; do not suppress with `@ts-ignore` or `@ts-expect-error` unless you add a comment that explains *exactly* why. |
| Implicit `any` | **Forbidden.** Every variable and parameter must have an inferable or explicit type. |
| Non-null assertions (`!`) | Avoid. Prefer optional chaining + explicit checks. |

Run `pnpm typecheck` (which runs `tsc --noEmit`) **before committing**. A build with
type errors must not be merged.

---

## Database access — Drizzle ORM

- **Never write raw SQL.** Use the Drizzle query builder (`db.select()`, `db.insert()`,
  `db.update()`, `db.delete()`, relational queries via `db.query.*`).
- Schema changes go in `src/db/schema.ts`. After editing the schema:
  1. `pnpm db:generate` — generates the migration file.
  2. `pnpm db:migrate` — applies it to the database.
  3. Commit **both** the schema change **and** the migration file together.
- Never run `pnpm db:push` in production-like environments; use migrations only.

---

## Authentication — Better Auth

- The auth instance lives in `src/lib/auth.ts` (server-side) and
  `src/lib/auth-client.ts` (client-side).
- The only verification method is **SMS OTP via the phone-number plugin**. Do not
  add email/password auth or social providers unless explicitly requested.
- SMS delivery is handled in `src/lib/sms-provider.ts`. When swapping providers,
  update only that file and the corresponding environment variables.
- Environment variables required at runtime are documented in `.env.local`. Never
  hard-code secrets.

---

## Linting & formatting — Biome

Biome is the single source of truth for formatting *and* linting. ESLint and Prettier
are **not** used and must not be added.

| Script | When to run |
|--------|-------------|
| `pnpm check` | Dry-run: shows all linting + formatting issues |
| `pnpm check:fix` | Auto-fix all fixable issues (run before committing) |
| `pnpm lint:fix` | Auto-fix linting issues only |
| `pnpm format` | Auto-fix formatting only |

The agent workflow before committing:

```bash
pnpm typecheck        # must exit 0
pnpm check:fix        # auto-fix everything Biome can
pnpm check            # verify nothing remains
```

---

## Verification workflow for agents

After every set of changes, run these scripts **in order** and fix all errors before
pushing:

```bash
pnpm typecheck   # TypeScript – no errors allowed
pnpm check:fix   # Biome auto-fix (formatting + lint)
pnpm check       # Biome final check – must be clean
pnpm build       # Vite build – must succeed
```

If any command exits non-zero, fix the problem and re-run. Do **not** skip or bypass
these checks.

---

## General conventions

- **No default exports** in library/utility modules (use named exports). Default
  exports are acceptable only in route files (TanStack Router convention).
- **Import paths**: use the `#/*` alias (`#/lib/auth`, `#/db/schema`) — never
  relative paths from deep directories.
- **Environment variables**: access only via `process.env.VAR_NAME`. Document every
  new variable in `.env.local` with an explanatory comment.
- **Error handling**: always handle or propagate errors explicitly; never swallow
  them silently.
- **Comments**: write comments that explain *why*, not *what*. Obvious code needs no
  comment.

---

## What NOT to do

- ❌ Add `any` anywhere in the codebase.
- ❌ Write raw SQL strings.
- ❌ Commit with failing type checks or linting errors.
- ❌ Edit `package.json` manually (except scripts via `pnpm pkg set`).
- ❌ Install packages with `npm` or `yarn`.
- ❌ Add new configuration files for tools (TypeScript, Vite, Biome) without first
  reading the latest official docs and cross-referencing the JSON schema in
  `node_modules`.
- ❌ Hard-code credentials or secrets.
