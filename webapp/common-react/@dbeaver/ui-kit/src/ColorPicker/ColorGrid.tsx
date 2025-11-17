/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ColorIndicator } from './ColorIndicator.js';
import { type UseColorPaletteResult } from './useColorPalette.js';
import { memo } from 'react';
import { useTranslate } from '@dbeaver/react-translate';
import { Command } from '../Command.js';

interface ColorGridProps {
  colorPalette: UseColorPaletteResult;
  onColorSelect: (color: string) => void;
}

export const ColorGrid: React.FC<ColorGridProps> = memo(function ColorGrid({ colorPalette, onColorSelect }) {
  const t = useTranslate();
  return (
    <div className="tw:flex tw:flex-col tw:gap-0.5" role="grid">
      {colorPalette.palette.map(row => (
        <div key={row[0]?.label ?? ''} role="row" className="tw:flex tw:gap-0.5">
          {row.map(color => {
            const isSelected = colorPalette.isSelected(color.rgb);
            const label = t('dbeaver_ui_kit_color_picker_color_label_' + color.label.replace(' ', '_'), color.label);

            return (
              <Command
                key={color.label}
                render={<div />}
                role="gridcell"
                aria-selected={isSelected}
                aria-label={label}
                title={label}
                className="tw:cursor-pointer tw:hover:scale-110 tw:transition-transform"
                onClick={() => onColorSelect(color.rgb)}
              >
                <ColorIndicator color={color.rgb} isSelected={isSelected} />
              </Command>
            );
          })}
        </div>
      ))}
    </div>
  );
});
