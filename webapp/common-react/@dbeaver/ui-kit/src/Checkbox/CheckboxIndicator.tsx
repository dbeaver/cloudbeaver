/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import clsx from 'clsx';
import './Checkbox.css';
import type { ControlSize } from '../types/controls.js';

export interface ICheckboxIndicatorProps {
  checked?: boolean | 'mixed';
  indeterminate?: boolean;
  disabled?: boolean;
  focusVisible?: boolean;
  size?: ControlSize;
  icon?: React.ReactNode;
  indeterminateIcon?: React.ReactNode;
  className?: string;
}

export function CheckboxIndicator({
  checked,
  indeterminate,
  disabled,
  focusVisible,
  size = 'medium',
  icon,
  indeterminateIcon,
  className,
}: ICheckboxIndicatorProps): React.ReactElement {
  return (
    <div
      className={clsx('dbv-kit-checkbox__check', `dbv-kit-checkbox--${size}`, className)}
      data-indeterminate={indeterminate}
      data-checked={checked}
      data-disabled={disabled || undefined}
      data-focus-visible={focusVisible || undefined}
    >
      {checked &&
        (icon ?? (
          <svg stroke="currentColor" strokeWidth="2" viewBox="0 0 16 16">
            <polyline fill="none" points="3,7 7,11 13,4" />
          </svg>
        ))}
      {indeterminate &&
        !checked &&
        (indeterminateIcon ?? (
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 16 16">
            <line x1="3" y1="8" x2="13" y2="8" />
          </svg>
        ))}
    </div>
  );
}
