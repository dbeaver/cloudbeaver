/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

/**
 * Converts RGB color format to hex format
 * @param rgb - Color in rgb(r, g, b) format
 * @returns Color in #rrggbb format
 */
export function rgbToHex(rgb: string): string {
  return rgb.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/, (_, r, g, b) => `#${[r, g, b].map(x => (+x).toString(16).padStart(2, '0')).join('')}`);
}

/**
 * Normalizes color value to hex format if it's in RGB format
 * @param color - Color value that might be in rgb or hex format
 * @returns Normalized color value (hex if it was rgb, otherwise unchanged)
 */
export function normalizeColorToHex(color: string | number | readonly string[] | undefined): string | number | readonly string[] | undefined {
  return typeof color === 'string' && color.startsWith('rgb') ? rgbToHex(color) : color;
}

export function hexToRgb(hex: string): string {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgb(${r}, ${g}, ${b})`;
}

export function normalizeColorToRgb(color: string): string {
  return typeof color === 'string' && color.startsWith('#') ? hexToRgb(color) : color;
}
