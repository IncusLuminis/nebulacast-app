#!/usr/bin/env node
// Simple dev server for local development with API endpoints
// Runs TypeScript functions via tsx or ts-node

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 8080;
const STAGING_DIR = path.join(__dirname, '../../sites/staging');

// Simple router for API endpoints
async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // API endpoints
  if (pathname.startsWith('/api/')) {
    try {
      if (pathname === '/api/astro-weather') {
        await handleAstroWeather(req, res, url, corsHeaders);
      } else if (pathname === '/api/geocode') {
        await handleGeocode(req, res, url, corsHeaders);
      } else if (pathname === '/api/revgeo') {
        await handleRevGeo(req, res, url, corsHeaders);
      } else {
        res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    } catch (error) {
      console.error('API error:', error);
      res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // Static files
  serveStatic(req, res, pathname);
}

async function handleAstroWeather(req, res, url, corsHeaders) {
  // Import and call the function
  const functionsPath = path.join(__dirname, '../../functions/api/astro-weather.ts');
  
  // For now, proxy to actual implementation or use a simple wrapper
  // Since we can't easily run TypeScript in Node without compilation,
  // we'll use a simple fallback: redirect to static JSON
  
  const lat = parseFloat(url.searchParams.get('lat') || '');
  const lon = parseFloat(url.searchParams.get('lon') || '');
  const tz = url.searchParams.get('tz') || 'Europe/Warsaw';
  
  if (isNaN(lat) || isNaN(lon)) {
    res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid lat/lon' }));
    return;
  }

  // Try to use tsx to run TypeScript directly
  try {
    const { execSync } = require('child_process');
    const scriptPath = path.join(__dirname, '../../scripts/run-api-astro-weather.js');
    
    // For now, return a simple response indicating API is available
    // but suggest using wrangler for full functionality
    res.writeHead(200, {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=600',
    });
    
    // Return a message that suggests using wrangler or static fallback
    res.end(JSON.stringify({
      message: 'API endpoint available. For full functionality, use: wrangler pages dev',
      note: 'This dev server is a placeholder. Use static JSON fallback or wrangler for full API.',
    }));
  } catch (error) {
    res.writeHead(503, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API not fully implemented in dev server. Use wrangler pages dev or static fallback.' }));
  }
}

async function handleGeocode(req, res, url, corsHeaders) {
  const q = url.searchParams.get('q');
  if (!q || q.length < 2) {
    res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Query too short' }));
    return;
  }

  // Use Nominatim directly
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=1`;
  
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(nominatimUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Nebulacast/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`);
    }
    
    const data = await response.json();
    const results = Array.isArray(data) ? data.map(item => ({
      name: item.display_name?.split(',')[0] || item.name || 'Unknown',
      country: item.address?.country || '',
      lat: parseFloat(item.lat) || 0,
      lon: parseFloat(item.lon) || 0,
    })).filter(item => item.lat !== 0 && item.lon !== 0) : [];
    
    res.writeHead(200, {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    });
    res.end(JSON.stringify(results));
  } catch (error) {
    console.error('Geocode error:', error);
    res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
}

async function handleRevGeo(req, res, url, corsHeaders) {
  const lat = parseFloat(url.searchParams.get('lat') || '');
  const lon = parseFloat(url.searchParams.get('lon') || '');
  
  if (isNaN(lat) || isNaN(lon)) {
    res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid lat/lon' }));
    return;
  }

  const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
  
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(nominatimUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Nebulacast/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`);
    }
    
    const data = await response.json();
    const address = data.address || {};
    
    res.writeHead(200, {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    });
    res.end(JSON.stringify({
      name: data.display_name || address.city || address.town || 'Unknown location',
      country: address.country || '',
    }));
  } catch (error) {
    console.error('RevGeo error:', error);
    res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
}

function serveStatic(req, res, pathname) {
  let filePath = path.join(STAGING_DIR, pathname === '/' ? 'index.html' : pathname);
  
  // Security: prevent directory traversal
  if (!filePath.startsWith(STAGING_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Try index.html for directories
      if (pathname.endsWith('/')) {
        filePath = path.join(filePath, 'index.html');
      } else {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
    }

    const ext = path.extname(filePath);
    const contentType = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.svg': 'image/svg+xml',
    }[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
}

const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}`);
  console.log(`Serving from: ${STAGING_DIR}`);
  console.log(`API endpoints: /api/astro-weather, /api/geocode, /api/revgeo`);
});
