import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => {
    if (command === 'serve') {
        return {
            root: rootDir,
        };
    }

    return {
        build: {
            lib: {
                entry: {
                    index: resolve(rootDir, 'src/index.js'),
                    vue: resolve(rootDir, 'src/vue/index.js'),
                    react: resolve(rootDir, 'src/react/index.jsx'),
                },
                formats: ['es'],
            },
            rollupOptions: {
                external: [
                    'vue',
                    'react',
                    'react/jsx-runtime',
                    'dayjs',
                    'dayjs/plugin/customParseFormat',
                ],
                output: {
                    assetFileNames: 'style.css',
                    chunkFileNames: 'picker-core.js',
                },
            },
            emptyOutDir: true,
        },
    };
});
