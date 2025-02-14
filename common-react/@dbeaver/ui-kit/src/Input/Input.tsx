/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ComponentPropsWithRef } from 'react';
import './Input.css';

export interface InputProps extends Omit<ComponentPropsWithRef<'input'>, 'size'> {
  size?: 'small' | 'medium' | 'large';
  error?: string;
  warning?: string;
}

export const Input: React.FC<InputProps> = function Input({ error, warning, size, ...props }) {
  const classNameToApply =
    `dbv-ui-input dbv-ui-input--${size ?? 'medium'} ${error ? 'dbv-ui-input-validation--error' : ''} ${warning ? 'dbv-ui-input-validation--warning' : ''}`.trim();
  return (
    <div className="dbv-ui-input-wrapper">
      <input className={classNameToApply} {...props} />
    </div>
  );
};
