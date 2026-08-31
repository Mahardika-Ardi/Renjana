'use client';

import { useEffect, useRef } from 'react';

import { LeafScene } from './scene/leaf-scene';

export default function LeafBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const leafScene = new LeafScene(container);

    leafScene.mount();

    return () => {
      leafScene.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="
        pointer-events-none
        absolute
        inset-0
        z-0
        overflow-hidden
      "
    />
  );
}
