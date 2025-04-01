/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Checkbox as AriaCheckbox, VisuallyHidden, type CheckboxProps as AriaKitCheckboxProps } from '@ariakit/react';
import { useState } from 'react';
import clsx from 'clsx';
import './Checkbox.css';
import type { ControlSize } from '../types/controls.js';

export interface CheckboxProps extends Omit<AriaKitCheckboxProps, 'render' | 'size'> {
  size?: ControlSize;
  icon?: React.ReactNode;
  indeterminate?: boolean;
  indeterminateIcon?: React.ReactNode;
}

export function Checkbox({ children, className, icon, indeterminate, indeterminateIcon, size = 'medium', ...props }: CheckboxProps) {
  const [innerChecked, setInnerChecked] = useState(props.defaultChecked ?? false);
  const checked = props.checked ?? innerChecked;

  const [focusVisible, setFocusVisible] = useState(false);
  return (
    <label
      className={clsx('dbv-kit-checkbox', `dbv-kit-checkbox--${size}`, className)}
      data-disabled={props.disabled || undefined}
      data-checked={checked}
      data-focus-visible={focusVisible || undefined}
    >
      <VisuallyHidden>
        <AriaCheckbox
          {...props}
          className="dbv-kit-checkbox__input"
          clickOnEnter
          onFocusVisible={() => setFocusVisible(true)}
          onBlur={() => setFocusVisible(false)}
          onChange={event => {
            setInnerChecked(event.target.checked);
            props.onChange?.(event);
          }}
        />
      </VisuallyHidden>

      <div
        className="dbv-kit-checkbox__check"
        data-indeterminate={indeterminate}
        data-checked={checked}
        data-focus-visible={focusVisible || undefined}
      >
        {checked &&
          (icon ?? (
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 16 16">
              <polyline points="3,7 7,11 13,4" />
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

      <span className="dbv-kit-checkbox__text">{children}</span>
    </label>
  );
}
