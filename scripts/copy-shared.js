/**
 * Copy Shared Data to Server
 * This script copies shared data files to the server directory during build.
 * Run: node scripts/copy-shared.js
 */

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ROOT = join(__dirname, '..')
const SHARED_ROOT = join(ROOT, 'src/shared')
const SERVER_DEST = join(ROOT, 'server/src/shared')

// Ensure destination directory exists
if (!existsSync(SERVER_DEST)) {
    mkdirSync(SERVER_DEST, { recursive: true })
}

// Files to copy (src relative to SHARED_ROOT, dest is flat in server/src/shared)
const FILES = [
    { src: 'data/itemTypes.ts', dest: 'itemTypes.ts' },
    { src: 'data/itemTemplates.ts', dest: 'itemTemplates.ts' },
    { src: 'lib/itemPricing.ts', dest: 'itemPricing.ts' },
    { src: 'data/coopScoreConfig.ts', dest: 'coopScoreConfig.ts' },
]

for (const file of FILES) {
    const src = join(SHARED_ROOT, file.src)
    const dest = join(SERVER_DEST, file.dest)

    if (existsSync(src)) {
        let content = readFileSync(src, 'utf8')
        if (file.dest === 'itemPricing.ts') {
            content = content.replace("from '../data/itemTypes'", "from './itemTypes'")
        }
        writeFileSync(dest, content, 'utf8')
        console.log(`✓ Copied ${file.src} → server/src/shared/${file.dest}`)
    } else {
        console.error(`✗ Source not found: ${src}`)
    }
}

console.log('Done!')
