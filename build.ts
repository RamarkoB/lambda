import * as esbuild from 'npm:esbuild';
import { copyFile } from 'node:fs/promises';

await esbuild.build({
    entryPoints: ['src/main.ts'],
    outfile: './dist/main.js',
    bundle: true,
    format: 'iife',
    sourcemap: true,
    target: 'es2022',
    platform: 'browser',
    loader: {
        '.ts': 'ts',
    },
});

// Copy index.html to dist directory
await copyFile('./index.html', './dist/index.html');
await copyFile('./styles.css', './dist/styles.css');

esbuild.stop();
