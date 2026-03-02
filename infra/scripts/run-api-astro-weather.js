#!/usr/bin/env node
// Wrapper to run astro-weather API function locally
// This requires the TypeScript functions to be compiled or run via tsx

// For now, this is a placeholder. The actual implementation should:
// 1. Use tsx or ts-node to run the TypeScript functions
// 2. Or use wrangler pages dev (recommended)

console.log('Use "wrangler pages dev" for full API functionality');
console.log('Or use infra/scripts/dev-server.js which proxies to Nominatim for geocode/revgeo');
