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
    loader: { '.ts': 'ts' },
});

// Copy index.html to dist directory
await copyFile('./static/index.html', './dist/index.html');
await copyFile('./static/styles.css', './dist/styles.css');
await copyFile('./static/Logo.png', './dist/Logo.png');

esbuild.stop();
