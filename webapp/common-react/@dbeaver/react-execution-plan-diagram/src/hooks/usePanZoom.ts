/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { select } from 'd3-selection';
import { type ZoomBehavior, zoom, zoomIdentity, type ZoomTransform } from 'd3-zoom';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface IPanZoomState {
  transform: ZoomTransform;
  containerRef: React.RefCallback<HTMLDivElement>;
  zoomIn(): void;
  zoomOut(): void;
  fitToScreen(contentWidth: number, contentHeight: number): void;
  setZoom(scale: number): void;
  resetView(): void;
}

const ZOOM_STEP = 1.3;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;

export function usePanZoom(): IPanZoomState {
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const zoomBehaviorRef = useRef<ZoomBehavior<HTMLDivElement, unknown> | null>(null);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setContainer(node);
  }, []);

  useEffect(() => {
    if (!container) {
      return;
    }

    const zoomBehavior = zoom<HTMLDivElement, unknown>()
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      .on('zoom', event => {
        setTransform(event.transform);
      });

    zoomBehaviorRef.current = zoomBehavior;

    const selection = select(container);
    selection.call(zoomBehavior);

    return () => {
      selection.on('.zoom', null);
      zoomBehaviorRef.current = null;
    };
  }, [container]);

  const zoomIn = useCallback(() => {
    const zoomBehavior = zoomBehaviorRef.current;

    if (container && zoomBehavior) {
      zoomBehavior.scaleBy(select(container), ZOOM_STEP);
    }
  }, [container]);

  const zoomOut = useCallback(() => {
    const zoomBehavior = zoomBehaviorRef.current;

    if (container && zoomBehavior) {
      zoomBehavior.scaleBy(select(container), 1 / ZOOM_STEP);
    }
  }, [container]);

  const fitToScreen = useCallback(
    (contentWidth: number, contentHeight: number) => {
      const zoomBehavior = zoomBehaviorRef.current;

      if (!container || !zoomBehavior || contentWidth === 0 || contentHeight === 0) {
        return;
      }

      const { clientWidth, clientHeight } = container;
      const padding = 40;
      const scaleX = (clientWidth - padding * 2) / contentWidth;
      const scaleY = (clientHeight - padding * 2) / contentHeight;
      const scale = Math.min(scaleX, scaleY, 1);
      const tx = (clientWidth - contentWidth * scale) / 2;
      const ty = (clientHeight - contentHeight * scale) / 2;

      zoomBehavior.transform(select(container), zoomIdentity.translate(tx, ty).scale(scale));
    },
    [container],
  );

  const setZoom = useCallback(
    (scale: number) => {
      const zoomBehavior = zoomBehaviorRef.current;

      if (container && zoomBehavior) {
        zoomBehavior.scaleTo(select(container), scale);
      }
    },
    [container],
  );

  const resetView = useCallback(() => {
    const zoomBehavior = zoomBehaviorRef.current;

    if (container && zoomBehavior) {
      zoomBehavior.transform(select(container), zoomIdentity);
    }
  }, [container]);

  return { transform, containerRef, zoomIn, zoomOut, fitToScreen, setZoom, resetView };
}
