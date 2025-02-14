/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Checkbox as AriaCheckbox, type CheckboxProps as AriaKitCheckboxProps } from '@ariakit/react';
import './Checkbox.css';

export interface CheckboxProps extends AriaKitCheckboxProps {}

export function Checkbox({ className, children, disabled, ...props }: CheckboxProps) {
  return (
    <label className="dbv-ui-checkbox-label">
      <AriaCheckbox disabled={disabled} className={className ?? '' + ' ' + 'dbv-ui-checkbox'} {...props} />
      {children}
    </label>
  );
}
