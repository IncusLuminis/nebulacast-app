# Astro Weather API service — documentation

Cloudflare Pages Function for on-demand astro-weather JSON.

## Overview

- **Main README**: [../README.md](../README.md) — API endpoint, params, response, scoring profiles
- **Endpoint**: `GET /api/astro-weather`
- **Components**: `providers/`, `score.ts`, `merge.ts`, `derived.ts`, `types.ts`

## Caching

- TTL: 10 minutes
- Cache key: full request URL
