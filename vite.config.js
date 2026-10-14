import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  if (mode === 'production') {
    const rawApiUrl = env.VITE_API_URL;
    if (!rawApiUrl || !rawApiUrl.trim()) {
      throw new Error('FATAL: VITE_API_URL must be defined for production builds.');
    }

    let parsed;
    try {
      parsed = new URL(rawApiUrl.trim());
    } catch {
      throw new Error(`FATAL: VITE_API_URL is an invalid URL: "${rawApiUrl}"`);
    }

    if (parsed.protocol !== 'https:') {
      throw new Error(`FATAL: VITE_API_URL must use HTTPS in production. Received: "${rawApiUrl}"`);
    }

    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      throw new Error(`FATAL: VITE_API_URL cannot point to localhost or loopback in production. Received: "${rawApiUrl}"`);
    }

    const cleanPath = parsed.pathname.replace(/\/+$/, '');
    if (cleanPath !== '/api') {
      throw new Error(`FATAL: VITE_API_URL must end with "/api" exactly once. Received pathname: "${parsed.pathname}"`);
    }

    if (env.VITE_IMAGE_BASE_URL && env.VITE_IMAGE_BASE_URL.trim()) {
      let parsedImg;
      try {
        parsedImg = new URL(env.VITE_IMAGE_BASE_URL.trim());
      } catch {
        throw new Error(`FATAL: VITE_IMAGE_BASE_URL is an invalid URL: "${env.VITE_IMAGE_BASE_URL}"`);
      }
      if (parsedImg.protocol !== 'https:') {
        throw new Error(`FATAL: VITE_IMAGE_BASE_URL must use HTTPS in production.`);
      }
      const imgHost = parsedImg.hostname.toLowerCase();
      if (imgHost === 'localhost' || imgHost === '127.0.0.1' || imgHost === '0.0.0.0' || imgHost === '::1') {
        throw new Error(`FATAL: VITE_IMAGE_BASE_URL cannot point to localhost in production.`);
      }
      if (parsedImg.pathname.replace(/\/+$/, '').endsWith('/api')) {
        throw new Error(`FATAL: VITE_IMAGE_BASE_URL cannot contain "/api". Images are served from backend origin.`);
      }
    }
  }

  return {
    plugins: [react()],
    server: {
      port: 5174, // Different from student app (usually 5173)
      host: true, // allow network access
      allowedHosts: true,
    }
  };
})
