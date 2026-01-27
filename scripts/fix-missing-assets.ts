
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');

const PLACEHOLDERS = {
    background: path.join(PUBLIC_DIR, 'images/backgrounds/workshop.jpg'),
    npc: path.join(PUBLIC_DIR, 'images/npcs/craftsman.jpg'),
    default: path.join(PUBLIC_DIR, 'images/backgrounds/workshop.jpg')
};

function ensureDir(filePath: string) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function main() {
    console.log('Running validation to find missing assets...');
    let output = '';
    try {
        // Run validation, expect it to fail (exit 1), so catch error
        output = execSync('npx tsx --tsconfig tsconfig.app.json scripts/validate-scenarios.ts', {
            cwd: PROJECT_ROOT,
            encoding: 'utf8',
            stdio: 'pipe'
        });
    } catch (e: any) {
        // Capture stdout/stderr from the error object if command failed
        output = e.stdout + e.stderr;
    }

    const regex = /Missing asset: (.*?) \(/g;
    const matches = [...output.matchAll(regex)];
    const missingPaths = [...new Set(matches.map(m => m[1]))];

    console.log(`Found ${missingPaths.length} unique missing assets.`);

    if (missingPaths.length === 0) {
        console.log('No missing assets found!');
        return;
    }

    missingPaths.forEach(relPath => {
        const destPath = path.join(PUBLIC_DIR, relPath);

        let source = PLACEHOLDERS.default;
        if (relPath.includes('backgrounds')) source = PLACEHOLDERS.background;
        if (relPath.includes('npcs') || relPath.includes('characters')) source = PLACEHOLDERS.npc;

        if (!fs.existsSync(source)) {
            console.error(`Placeholder source missing: ${source}`);
            return;
        }

        ensureDir(destPath);
        fs.copyFileSync(source, destPath);
        console.log(`Created placeholder for: ${relPath}`);
    });

    console.log('All placeholders created.');
}

main();
