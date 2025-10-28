/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import clsx from 'clsx';
import { isLightColor } from './isLightColor.js';
import { memo } from 'react';

interface Props {
  color: string;
  isSelected?: boolean;
}

export const ColorIndicator = memo(function ColorIndicator({ color, isSelected }: Props) {
  const isLight = isLightColor(color);
  const selectedMark = isLight ? 'dbv-kit-color-picker__color--selected-light' : 'dbv-kit-color-picker__color--selected-dark';

  return (
    <div
      className={clsx(
        'dbv_kit_color-picker__color tw:w-5 tw:h-5 tw:rounded-full tw:border tw:border-(--dbv-kit-color-picker-border-color)',
        isSelected && selectedMark,
      )}
      style={{ backgroundColor: color }}
    />
  );
});
