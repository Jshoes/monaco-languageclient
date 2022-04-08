import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: [
            {
                find: 'vscode',
                replacement: path.resolve(__dirname, './src/vscode-compatibility')
            }
        ]
    },
    optimizeDeps: {
        // we need this as it is locally referenced/linked by the examples
        // if it is regular dependency resoled from npmjs this is not required
        include: ['monaco-languageclient']
    },
    build: {
        rollupOptions: {
        },
        outDir: 'dist',
        emptyOutDir: false,
        lib: {
            entry: path.resolve(__dirname, './src/index.ts'),
            name: 'mlc',
            fileName: () => 'mlc-[format].js',
            formats: ['cjs', 'es']
        },
    },
    server: {
        port: 8080
    }
});
