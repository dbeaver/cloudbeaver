/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
@import './_base.css';
@import './_sizes.css';
@import './_variants.css';

import type { ComponentPropsWithRef } from 'react';
import './Input.css';

export interface InputProps extends Omit<ComponentPropsWithRef<'input'>, 'size'> {
  size?: 'small' | 'medium' | 'large';
  error?: string;
  warning?: string;
}

export const Input: React.FC<InputProps> = function Input({ error, warning, size, ...props }) {
  const classNameToApply =
    `dbv-kit-input dbv-kit-input--${size ?? 'medium'} ${error ? 'dbv-kit-input-validation--error' : ''} ${warning ? 'dbv-kit-input-validation--warning' : ''}`.trim();
  return (
    <div className="dbv-kit-input-wrapper">
      <input className={classNameToApply} {...props} />
    </div>
  );
};
