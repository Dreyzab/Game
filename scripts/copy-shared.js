/**
 * Mirror shared modules into the backend.
 *
 * This keeps the server self-contained (no imports from the frontend source tree),
 * and enables API type generation via `npm run api:types`.
 *
 * Mirrors:
 * - `src/shared/types/**` -> `server/src/shared/types/**`
 * - `src/shared/data/**`  -> `server/src/shared/data/**`
 * - (selected) `src/shared/lib/*.ts` -> `server/src/shared/lib/*.ts`
 *
 * Run: `node scripts/copy-shared.js`
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ROOT = join(__dirname, '..')
const SHARED_ROOT = join(ROOT, 'src/shared')
const SERVER_SHARED_ROOT = join(ROOT, 'server/src/shared')

const ensureDir = (dir) => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

const resetDir = (dir) => {
  rmSync(dir, { recursive: true, force: true })
  ensureDir(dir)
}

const shouldIgnoreFile = (filename) =>
  filename.endsWith('.test.ts') ||
  filename.endsWith('.spec.ts') ||
  filename.endsWith('.test.tsx') ||
  filename.endsWith('.spec.tsx')

const copyDirRecursive = (srcDir, destDir) => {
  ensureDir(destDir)
  const entries = readdirSync(srcDir, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name)
    const destPath = join(destDir, entry.name)
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath)
      continue
    }
    if (shouldIgnoreFile(entry.name)) continue
    ensureDir(dirname(destPath))
    copyFileSync(srcPath, destPath)
  }
}

ensureDir(SERVER_SHARED_ROOT)

const TYPES_SRC = join(SHARED_ROOT, 'types')
const DATA_SRC = join(SHARED_ROOT, 'data')
const LIB_SRC = join(SHARED_ROOT, 'lib')

const TYPES_DEST = join(SERVER_SHARED_ROOT, 'types')
const DATA_DEST = join(SERVER_SHARED_ROOT, 'data')
const LIB_DEST = join(SERVER_SHARED_ROOT, 'lib')

if (!existsSync(TYPES_SRC)) throw new Error(`Missing shared types dir: ${TYPES_SRC}`)
if (!existsSync(DATA_SRC)) throw new Error(`Missing shared data dir: ${DATA_SRC}`)

resetDir(TYPES_DEST)
copyDirRecursive(TYPES_SRC, TYPES_DEST)

resetDir(DATA_DEST)
copyDirRecursive(DATA_SRC, DATA_DEST)

// Selected shared libs that are safe for server usage.
ensureDir(LIB_DEST)
for (const filename of ['itemPricing.ts', 'skillChecks.ts', 'stats.ts']) {
  const srcPath = join(LIB_SRC, filename)
  const destPath = join(LIB_DEST, filename)
  if (!existsSync(srcPath)) continue
  copyFileSync(srcPath, destPath)
}

// Remove legacy flat copies (kept only for earlier iterations).
for (const legacy of ['itemTypes.ts', 'itemTemplates.ts', 'itemPricing.ts', 'coopScoreConfig.ts']) {
  rmSync(join(SERVER_SHARED_ROOT, legacy), { force: true })
}

console.log('[copy-shared] Mirrored shared types/data to server/src/shared')
