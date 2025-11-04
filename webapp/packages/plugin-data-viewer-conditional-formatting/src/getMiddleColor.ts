/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function getMiddleColor(minColor: string, maxColor: string): string {
  // Create a temporary canvas to parse CSS colors
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    return minColor;
  }

  // Parse first color
  ctx.fillStyle = minColor;
  ctx.fillRect(0, 0, 1, 1);
  const [r1, g1, b1] = ctx.getImageData(0, 0, 1, 1).data;

  // Parse second color
  ctx.fillStyle = maxColor;
  ctx.fillRect(0, 0, 1, 1);
  const [r2, g2, b2] = ctx.getImageData(0, 0, 1, 1).data;

  // Calculate middle values
  const rMid = Math.round((r1! + r2!) / 2);
  const gMid = Math.round((g1! + g2!) / 2);
  const bMid = Math.round((b1! + b2!) / 2);

  // Return as hex color
  return `#${rMid.toString(16).padStart(2, '0')}${gMid.toString(16).padStart(2, '0')}${bMid.toString(16).padStart(2, '0')}`;
}
