/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

/** Canvases stop rendering reliably somewhere around this side length. */
export const DEFAULT_MAX_IMAGE_SIDE = 8192;

/** ~16 Mpx, about 64 MB of RGBA. */
export const DEFAULT_MAX_IMAGE_PIXELS = 16_777_216;

const MIN_SCALE = 0.05;

export interface IPixelBudget {
  /** Device pixel ratio to aim for. Defaults to 1. */
  scale?: number;
  maxSide?: number;
  maxPixels?: number;
}

export function fitToPixelBudget(width: number, height: number, budget?: IPixelBudget): number {
  const { scale = 1, maxSide = DEFAULT_MAX_IMAGE_SIDE, maxPixels = DEFAULT_MAX_IMAGE_PIXELS } = budget ?? {};

  if (width <= 0 || height <= 0) {
    return scale;
  }

  const fitted = Math.min(scale, maxSide / width, maxSide / height, Math.sqrt(maxPixels / (width * height)));

  return Math.max(fitted, Math.min(scale, MIN_SCALE));
}
