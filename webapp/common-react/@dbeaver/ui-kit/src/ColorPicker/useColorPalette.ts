/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useMemo } from 'react';
import { normalizeColorToHex } from './colorUtils.js';
import { COLOR_PALETTE, type ColorInfo } from './colorPalette.js';

export interface UseColorPaletteResult {
  palette: ColorInfo[][];
  paletteColorsHex: Set<string>;
  isSelected: (targetColor: string) => boolean;
  isCustomColor: (color: string) => boolean;
}

export function useColorPalette(value: string | undefined, palette: ColorInfo[][] = COLOR_PALETTE): UseColorPaletteResult {
  const normalized = value !== undefined ? normalizeColorToHex(value) : undefined;
  const paletteColorsHex = useMemo(() => new Set(palette.flat().map(color => normalizeColorToHex(color.rgb))), [palette]);

  const isSelected = useMemo(
    () => (targetColor: string) => {
      const targetHex = normalizeColorToHex(targetColor);
      return normalized === targetHex;
    },
    [normalized],
  );

  const isCustomColor = useMemo(
    () => (color: string) => {
      if (!color) {
        return false;
      }
      const normalized = normalizeColorToHex(color);
      return typeof normalized === 'string' && !paletteColorsHex.has(normalized);
    },
    [paletteColorsHex],
  );

  return useMemo(
    () => ({
      palette,
      paletteColorsHex,
      isSelected,
      isCustomColor,
    }),
    [palette, paletteColorsHex, isSelected, isCustomColor],
  );
}
