// map-widget.js - UI components initialization and integration

// Import UI components from sky
import '/../ui/components/player.js';
import '/../ui/components/side_toolbar.js';
import '/../ui/components/bottom_toolbar.js';

// SVG icons (from sky widget)
const SVG_HOME = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>';
const SVG_FULLSCREEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>';
const SVG_TERRAIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 20l6-8 4 4 8-12"/></svg>';
const SVG_CLOUDS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>';
const SVG_RADAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2v10l3.5 3.5"/></svg>';

// Store UI component references globally
window.uiComponents = {
  sidebarLeft: document.getElementById('sidebarLeft'),
  sidebarRight: document.getElementById('sidebarRight'),
  toolbarBottom: document.getElementById('toolbarBottom'),
  mapPlayer: document.getElementById('mapPlayer')
};

// ========================================
// LEFT SIDEBAR (Home button)
// ========================================
if (window.uiComponents.sidebarLeft) {
  window.uiComponents.sidebarLeft.items = [
    { id: 'home', icon: SVG_HOME, label: 'Home', kind: 'action' }
  ];
  
  window.uiComponents.sidebarLeft.addEventListener('toolbar:action', (e) => {
    if (e.detail.id === 'home' && window.map && window.homeCenter) {
      window.map.setView(window.homeCenter, window.currentZoom || 8);
    }
  });
}

// ========================================
// RIGHT SIDEBAR (Fullscreen button)
// ========================================
if (window.uiComponents.sidebarRight) {
  window.uiComponents.sidebarRight.items = [
    { id: 'fullscreen', icon: SVG_FULLSCREEN, label: 'Fullscreen', kind: 'toggle', pressed: false }
  ];
  
  window.uiComponents.sidebarRight.addEventListener('toolbar:toggle', (e) => {
    if (e.detail.id === 'fullscreen') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen();
      }
    }
  });
  
  // Update fullscreen button state
  document.addEventListener('fullscreenchange', () => {
    const isFs = !!document.fullscreenElement;
    window.uiComponents.sidebarRight.setPressed('fullscreen', isFs);
  });
}

// ========================================
// BOTTOM TOOLBAR (Layers)
// ========================================
if (window.uiComponents.toolbarBottom) {
  window.uiComponents.toolbarBottom.items = [
    { id: 'terrain', icon: SVG_TERRAIN, title: 'Terrain', kind: 'toggle', pressed: true },
    { id: 'clouds', icon: SVG_CLOUDS, title: 'Clouds (GIBS)', kind: 'toggle', pressed: true },
    { id: 'radar', icon: SVG_RADAR, title: 'Radar', kind: 'toggle', pressed: false }
  ];
  
  window.uiComponents.toolbarBottom.addEventListener('toolbar:toggle', (e) => {
    const { id, pressed } = e.detail;
    
    if (id === 'terrain') {
      window.terrainOn = pressed;
      if (window.map && window.baseLayer) {
        if (pressed) {
          window.map.addLayer(window.baseLayer);
        } else {
          window.map.removeLayer(window.baseLayer);
        }
      }
      if (window.saveLayerState) window.saveLayerState();
      
    } else if (id === 'clouds') {
      window.gibsOn = pressed;
      if (window.gibsLayer) {
        if (pressed) {
          window.map.addLayer(window.gibsLayer);
        } else {
          window.map.removeLayer(window.gibsLayer);
        }
      }
      if (window.saveLayerState) window.saveLayerState();
      
    } else if (id === 'radar') {
      window.radarOn = pressed;
      if (window.radarAdapter) {
        window.radarAdapter.setVisible(pressed);
      }
      if (window.saveLayerState) window.saveLayerState();
    }
  });
}

// ========================================
// PLAYER (Time controls)
// ========================================
if (window.uiComponents.mapPlayer) {
  window.uiComponents.mapPlayer.setTime(0, 86400); // 24 hours default
  
  // Toggle play/pause
  window.uiComponents.mapPlayer.addEventListener('player:toggle', (e) => {
    if (window.togglePlayPause) {
      window.togglePlayPause();
    }
  });
  
  // Seek (scrubber drag)
  window.uiComponents.mapPlayer.addEventListener('player:seek', (e) => {
    if (window.startTimeUtcMs && window.endTimeUtcMs && window.setTimeUtc) {
      const range = window.endTimeUtcMs - window.startTimeUtcMs;
      const newTime = window.startTimeUtcMs + (range * e.detail.position01);
      window.setTimeUtc(newTime, { source: 'ui' });
    }
  });
  
  // Seek to first
  window.uiComponents.mapPlayer.addEventListener('player:seek-first', () => {
    if (window.startTimeUtcMs && window.setTimeUtc) {
      window.setTimeUtc(window.startTimeUtcMs, { source: 'ui' });
    }
  });
  
  // Step backward
  window.uiComponents.mapPlayer.addEventListener('player:seek-back', () => {
    if (window.currentTimeUtcMs && window.stepHours && window.setTimeUtc) {
      const newTime = window.currentTimeUtcMs - (window.stepHours * 3600 * 1000);
      window.setTimeUtc(newTime, { source: 'ui' });
    }
  });
  
  // Step forward
  window.uiComponents.mapPlayer.addEventListener('player:seek-forward', () => {
    if (window.currentTimeUtcMs && window.stepHours && window.setTimeUtc) {
      const newTime = window.currentTimeUtcMs + (window.stepHours * 3600 * 1000);
      window.setTimeUtc(newTime, { source: 'ui' });
    }
  });
  
  // Jump to now
  window.uiComponents.mapPlayer.addEventListener('player:seek-now', () => {
    if (window.setTimeUtc) {
      window.setTimeUtc(Date.now(), { source: 'ui' });
    }
  });
}

// ========================================
// HELPER: Update player UI from map logic
// ========================================
window.updatePlayerUI = function() {
  if (!window.uiComponents.mapPlayer) return;
  if (!window.startTimeUtcMs || !window.endTimeUtcMs || !window.currentTimeUtcMs) return;
  
  const duration = (window.endTimeUtcMs - window.startTimeUtcMs) / 1000;
  const current = (window.currentTimeUtcMs - window.startTimeUtcMs) / 1000;
  
  window.uiComponents.mapPlayer.setTime(current, duration);
  window.uiComponents.mapPlayer.setPlaying(window.isPlaying || false);
};

console.log('[Map] UI components initialized');