/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { memo } from 'react';
import { clsx } from '@dbeaver/ui-kit';
import { getColorMix } from '../utils/getColorMix.js';

interface Props extends React.PropsWithChildren {
  leftColor: string;
  midColor?: string;
  rightColor: string;
  className?: string;
  color?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'overline' | 'line-through' | string | string[];
}

export const ColorScalePreview = memo<Props>(function ColorScalePreview({
  leftColor,
  midColor,
  rightColor,
  color,
  fontWeight,
  fontStyle,
  textDecoration,
  children,
  className,
}) {
  midColor = midColor === undefined ? getColorMix(leftColor, rightColor, 0.5) : midColor;
  const leftSubColor = getColorMix(leftColor, midColor, 0.5);
  const rightSubColor = getColorMix(midColor, rightColor, 0.5);

  return (
    <div
      className={clsx(
        'tw:w-full tw:h-8 tw:border tw:flex tw:items-center tw:justify-center theme-text-on-surface theme-border-color-background',
        className,
      )}
      style={{
        background: `linear-gradient(to right, ${leftColor}, ${leftColor} 20%, ${leftSubColor} 20%, ${leftSubColor} 40%, ${midColor} 40%, ${midColor} 60%, ${rightSubColor} 60%, ${rightSubColor} 80%, ${rightColor} 80%, ${rightColor})`,
        borderRadius: 'var(--theme-form-element-radius)',
        color,
        fontWeight,
        fontStyle,
        textDecoration: Array.isArray(textDecoration) ? textDecoration.join(' ') : textDecoration,
      }}
    >
      {children}
    </div>
  );
});
