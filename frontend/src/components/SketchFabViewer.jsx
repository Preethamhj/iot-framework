import React from 'react';

// Configuration for your Digital Twins
const MODELS = {
  'ESP32': {
    id: 'c2262672a90f45f7a26753ef8b6d7993',
    title: 'ESP32-DevkitC32U Digital Twin',
    author: 'shohan', 
    authorUrl: 'https://sketchfab.com/shohan',
    modelUrl: 'https://sketchfab.com/3d-models/esp32-devkitc32u-c2262672a90f45f7a26753ef8b6d7993'
  },
  'Raspberry Pi': {
    id: '400ac2e34cf8458aa4133192d87d9711',
    title: 'Rasberry Pi3B+',
    author: 'nithinnayak165',
    authorUrl: 'https://sketchfab.com/nithinnayak165',
    modelUrl: 'https://sketchfab.com/3d-models/rasberry-pi3b-400ac2e34cf8458aa4133192d87d9711'
  },
  'Ultrasonic': {
    id: '96737382ec4d4c0f94f581be7e1fd0d8',
    title: 'Ultrasonic',
    author: 'nithinnayak165',
    authorUrl: 'https://sketchfab.com/nithinnayak165',
    modelUrl: 'https://sketchfab.com/3d-models/ultrasonic-96737382ec4d4c0f94f581be7e1fd0d8'
  },
  // Fallback
  'default': {
    id: 'c2262672a90f45f7a26753ef8b6d7993',
    title: 'Generic Device',
    author: 'shohan',
    authorUrl: 'https://sketchfab.com/shohan',
    modelUrl: 'https://sketchfab.com/3d-models/esp32-devkitc32u-c2262672a90f45f7a26753ef8b6d7993'
  }
};

export default function SketchfabViewer({ deviceType }) {
  // Determine which model to show. Default to ESP32 if type not found.
  const modelKey = (deviceType && MODELS[deviceType]) ? deviceType : 'default';
  const activeModel = MODELS[modelKey];

  return (
    <div className="sketchfab-embed-wrapper" style={{ width: '100%', height: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
      <iframe
        title={activeModel.title}
        frameBorder="0"
        allowFullScreen
        mozallowfullscreen="true"
        webkitallowfullscreen="true"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        xr-spatial-tracking="true"
        execution-while-out-of-viewport="true"
        execution-while-not-rendered="true"
        web-share="true"
        src={`https://sketchfab.com/models/${activeModel.id}/embed`}
        style={{ width: '100%', flex: 1, borderRadius: '12px 12px 0 0' }}
      />
      <p style={{ fontSize: '13px', fontWeight: 'normal', margin: '8px', color: '#9CA3AF', textAlign: 'center' }}>
        <a
          href={`${activeModel.modelUrl}?utm_medium=embed&utm_campaign=share-popup&utm_content=${activeModel.id}`}
          target="_blank"
          rel="nofollow noreferrer"
          style={{ fontWeight: 'bold', color: '#1CAAD9', textDecoration: 'none' }}
        >
          {activeModel.title}
        </a>
        {' by '}
        <a
          href={`${activeModel.authorUrl}?utm_medium=embed&utm_campaign=share-popup&utm_content=${activeModel.id}`}
          target="_blank"
          rel="nofollow noreferrer"
          style={{ fontWeight: 'bold', color: '#1CAAD9', textDecoration: 'none' }}
        >
          {activeModel.author}
        </a>
        {' on '}
        <a
          href={`https://sketchfab.com?utm_medium=embed&utm_campaign=share-popup&utm_content=${activeModel.id}`}
          target="_blank"
          rel="nofollow noreferrer"
          style={{ fontWeight: 'bold', color: '#1CAAD9', textDecoration: 'none' }}
        >
          Sketchfab
        </a>
      </p>
    </div>
  );
}