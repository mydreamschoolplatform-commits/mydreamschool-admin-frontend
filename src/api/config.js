// Centralized API Configuration

// Centralized API Configuration

export function validateProductionConfig(rawApiUrl, rawImageUrl) {
    if (!rawApiUrl || typeof rawApiUrl !== 'string' || !rawApiUrl.trim()) {
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

    const hostname = parsed.hostname.toLowerCase();
    const isLocalhostOrLoopback =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname === '::1' ||
        hostname.endsWith('.local') ||
        hostname.endsWith('.internal');

    if (isLocalhostOrLoopback) {
        throw new Error(`FATAL: VITE_API_URL cannot point to localhost or loopback in production. Received: "${rawApiUrl}"`);
    }

    const normalizedPath = parsed.pathname.replace(/\/+$/, '');
    if (normalizedPath !== '/api') {
        throw new Error(`FATAL: VITE_API_URL must end with "/api" exactly once. Received pathname: "${parsed.pathname}"`);
    }

    const apiUrl = `${parsed.origin}/api`;

    // Image Base URL Resolution
    let imageUrl;
    if (rawImageUrl && typeof rawImageUrl === 'string' && rawImageUrl.trim()) {
        let parsedImg;
        try {
            parsedImg = new URL(rawImageUrl.trim());
        } catch {
            throw new Error(`FATAL: VITE_IMAGE_BASE_URL is an invalid URL: "${rawImageUrl}"`);
        }
        if (parsedImg.protocol !== 'https:') {
            throw new Error(`FATAL: VITE_IMAGE_BASE_URL must use HTTPS in production. Received: "${rawImageUrl}"`);
        }
        const imgHost = parsedImg.hostname.toLowerCase();
        if (imgHost === 'localhost' || imgHost === '127.0.0.1' || imgHost === '0.0.0.0' || imgHost === '::1') {
            throw new Error(`FATAL: VITE_IMAGE_BASE_URL cannot point to localhost in production. Received: "${rawImageUrl}"`);
        }
        const imgPath = parsedImg.pathname.replace(/\/+$/, '');
        if (imgPath.endsWith('/api')) {
            throw new Error(`FATAL: VITE_IMAGE_BASE_URL cannot contain "/api". Images are served from backend origin.`);
        }
        imageUrl = `${parsedImg.origin}${imgPath}`;
    } else {
        // Safely derive image base URL from API URL origin
        imageUrl = parsed.origin;
    }

    return { apiUrl, imageUrl };
}

export function resolveDevelopmentConfig(rawApiUrl, rawImageUrl) {
    const apiUrl = (rawApiUrl && rawApiUrl.trim()) ? rawApiUrl.trim().replace(/\/+$/, '') : 'http://localhost:5000/api';
    let defaultDevImage = 'http://localhost:5000';
    try {
        defaultDevImage = new URL(apiUrl).origin;
    } catch {
        // use default
    }
    const imageUrl = (rawImageUrl && rawImageUrl.trim())
        ? rawImageUrl.trim().replace(/\/+$/, '')
        : defaultDevImage;

    return { apiUrl, imageUrl };
}

export function validateAndResolveConfig(rawApiUrl, rawImageUrl, isProd = import.meta.env?.PROD ?? false) {
    return isProd
        ? validateProductionConfig(rawApiUrl, rawImageUrl)
        : resolveDevelopmentConfig(rawApiUrl, rawImageUrl);
}

const resolved = import.meta.env?.PROD
    ? validateProductionConfig(import.meta.env?.VITE_API_URL, import.meta.env?.VITE_IMAGE_BASE_URL)
    : resolveDevelopmentConfig(import.meta.env?.VITE_API_URL, import.meta.env?.VITE_IMAGE_BASE_URL);

export const API_BASE_URL = resolved.apiUrl;
export const IMAGE_BASE_URL = resolved.imageUrl;

export default API_BASE_URL;
