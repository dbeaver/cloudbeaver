/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Checkbox as AriaCheckbox, VisuallyHidden, type CheckboxProps as AriaKitCheckboxProps } from '@ariakit/react';
import { useState } from 'react';
import './Checkbox.css';
import type { ControlSize } from '../types/controls.js';

export interface CheckboxProps extends Omit<AriaKitCheckboxProps, 'render' | 'size'> {
  size?: ControlSize;
  icon?: React.ReactNode;
}

export function Checkbox({ children, className, icon, size = 'medium', ...props }: CheckboxProps) {
  const [checked, setChecked] = useState(props.defaultChecked ?? props.checked ?? false);
  const [focusVisible, setFocusVisible] = useState(false);
  return (
    <label
      className={`dbv-kit-checkbox dbv-kit-checkbox--${size}` + (className ? ` ${className}` : '')}
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
            setChecked(event.target.checked);
            props.onChange?.(event);
          }}
        />
      </VisuallyHidden>

      <div className="dbv-kit-checkbox__check" data-checked={checked} data-focus-visible={focusVisible || undefined}>
        {checked &&
          (icon ?? (
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 16 16">
              <polyline points="3,7 7,11 13,4" />
            </svg>
          ))}
      </div>

      <span className="dbv-kit-checkbox__text">{children}</span>
    </label>
  );
}
