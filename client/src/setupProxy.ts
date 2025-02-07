// setupProxy.ts
import { createProxyMiddleware } from 'http-proxy-middleware';

export default function setupProxy(app) {
    app.use(
        '/auth', // The path you want to proxy
        createProxyMiddleware({
            target: 'http://localhost:5000', // Your backend API URL
            changeOrigin: true,
            pathRewrite: {
                '^/auth': '', // Remove the /api prefix when forwarding
            },
        })
    );
}
