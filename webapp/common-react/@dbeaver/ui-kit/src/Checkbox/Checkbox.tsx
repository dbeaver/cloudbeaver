/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Checkbox as AriaCheckbox, VisuallyHidden, type CheckboxProps as AriaKitCheckboxProps } from '@ariakit/react';
import { useState } from 'react';
import clsx from 'clsx';
import './Checkbox.css';
import type { ControlSize } from '../types/controls.js';
import { componentProviderWrapper } from '../componentProviderWrapper.js';
import { CheckboxIndicator } from './CheckboxIndicator.js'; 

export interface CheckboxProps extends Omit<AriaKitCheckboxProps, 'render' | 'size'> {
  size?: ControlSize;
  icon?: React.ReactNode;
  indeterminate?: boolean;
  indeterminateIcon?: React.ReactNode;
}

export function CheckboxBase({ children, className, icon, indeterminate, indeterminateIcon, size = 'medium', ...props }: CheckboxProps): React.ReactElement {
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

      <CheckboxIndicator
        checked={checked}
        indeterminate={indeterminate}
        disabled={props.disabled}
        focusVisible={focusVisible}
        size={size}
        icon={icon}
        indeterminateIcon={indeterminateIcon}
      />

      <span className="dbv-kit-checkbox__text">{children}</span>
    </label>
  );
}

export const Checkbox = Object.assign(componentProviderWrapper('Checkbox', CheckboxBase), { Indicator: CheckboxIndicator });
