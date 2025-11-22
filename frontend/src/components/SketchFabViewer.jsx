import React from 'react';

export default function SketchfabViewer() {
  return (
    <div className="sketchfab-embed-wrapper" style={{ width: '100%', height: '100%', minHeight: '400px' }}>
      <iframe
        title="ESP32-DevkitC32U Digital Twin"
        frameBorder="0"
        allowFullScreen
        mozallowfullscreen="true"
        webkitallowfullscreen="true"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        xr-spatial-tracking="true"
        execution-while-out-of-viewport="true"
        execution-while-not-rendered="true"
        web-share="true"
        src="https://sketchfab.com/models/c2262672a90f45f7a26753ef8b6d7993/embed"
        style={{ width: '100%', height: '100%', borderRadius: '12px' }}
      />
    </div>
  );
}