/**
 * Where the backend lives.
 *
 * Only the production URL is a constant. In development the host is worked
 * out at runtime from whatever machine Metro is serving the bundle from,
 * because a hardcoded LAN address is wrong the moment anyone changes network
 * — and the symptom (the app loads, every request times out) sends you
 * looking at the API rather than at your IP.
 */
export const PRODUCTION_API_URL = 'https://magneticbarber.co.zw/api/v1';

/** Fallback when the Metro host cannot be read. */
export const FALLBACK_API_URL = 'http://localhost:8000/api/v1';

/** The Laravel dev server's port, as `php artisan serve` and Herd use it. */
export const DEV_API_PORT = 8000;
