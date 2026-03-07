"use client";

import React from 'react';

export default function ImageLightbox({ src, onClose }: { src: string | null; onClose: () => void }) {
  if (!src) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div style={{ maxWidth: '90%', maxHeight: '90%', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <img src={src} alt="Gallery" style={{ width: '100%', height: 'auto', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }} />
        <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>Close</button>
      </div>
    </div>
  );
}
