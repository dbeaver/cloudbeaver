/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Checkbox as AriaCheckbox, type CheckboxProps } from '@ariakit/react';
import './Checkbox.css';

export interface UIKitCheckboxProps extends CheckboxProps {}

export function Checkbox({ className, children, disabled, ...props }: UIKitCheckboxProps) {
  return (
    <label className="checkbox-label">
      <AriaCheckbox disabled={disabled} className={className ?? '' + ' ' + 'checkbox'} {...props} />
      {children}
    </label>
  );
}
