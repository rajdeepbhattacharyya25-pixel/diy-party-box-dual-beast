import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import zlib from 'node:zlib';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

/**
 * Native dev-server compression middleware using Node's built-in node:zlib.
 * Compresses JavaScript, CSS, HTML, JSON, SVG, and WASM responses with Gzip (level 5)
 * and in-memory cache to eliminate dev-server payload penalties under Lighthouse.
 */
function devServerCompressionPlugin(): Plugin {
  const cache = new Map<string, { etag: string; buffer: Buffer }>();

  return {
    name: 'dev-server-compression',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const acceptEncoding = (req.headers['accept-encoding'] as string) || '';
        if (!acceptEncoding.includes('gzip')) {
          return next();
        }

        const rawWrite = res.write.bind(res);
        const rawEnd = res.end.bind(res);
        const chunks: Buffer[] = [];

        res.write = function (chunk: any, ...args: any[]) {
          if (chunk) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          return true;
        } as any;

        res.end = function (chunk?: any, ...args: any[]) {
          if (chunk && typeof chunk !== 'function') {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          const cb = typeof chunk === 'function' ? chunk : args[0];
          const body = Buffer.concat(chunks);
          if (body.length === 0) {
            return rawEnd.apply(res, arguments as any);
          }

          const contentType = (res.getHeader('content-type') as string) || '';
          const isCompressible =
            /text|javascript|json|css|svg|xml|wasm/i.test(contentType) &&
            !res.getHeader('content-encoding') &&
            body.length >= 256;

          if (isCompressible && !res.headersSent) {
            const cacheKey = req.url || '';
            const existingEtag = (res.getHeader('etag') as string) || '';
            let gzipped: Buffer | null = null;

            if (cache.has(cacheKey)) {
              const cached = cache.get(cacheKey)!;
              if (!existingEtag || cached.etag === existingEtag) {
                gzipped = cached.buffer;
              }
            }

            if (!gzipped) {
              try {
                gzipped = zlib.gzipSync(body, { level: 5 });
                cache.set(cacheKey, { etag: existingEtag, buffer: gzipped });
              } catch {
                gzipped = null;
              }
            }

            if (!res.headersSent && gzipped && gzipped.length < body.length) {
              try {
                res.setHeader('Content-Encoding', 'gzip');
                res.setHeader('Content-Length', gzipped.length);
                res.setHeader('Vary', 'Accept-Encoding');
                return rawEnd.call(res, gzipped, cb);
              } catch {
                // Fallback if headers were sent in parallel
              }
            }
          }

          return rawEnd.call(res, body, cb);
        } as any;

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [devServerCompressionPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 750,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            const normalizedId = id.replace(/\\/g, '/');
            if (
              normalizedId.includes('/node_modules/react/') ||
              normalizedId.includes('/node_modules/react-dom/')
            ) {
              return 'vendor-react';
            }
            if (normalizedId.includes('/node_modules/three/')) {
              return 'vendor-three';
            }
            if (
              normalizedId.includes('/node_modules/motion/') ||
              normalizedId.includes('/node_modules/lucide-react/')
            ) {
              return 'vendor-motion';
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
