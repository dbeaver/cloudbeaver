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
  size?: 'small' | 'medium' | 'large' | 'xlarge';
}

export const Input: React.FC<InputProps> = function Input({ size, className, ...props }) {
  const classNameToApply = `dbv-kit-input dbv-kit-input--${size ?? 'medium'} ${className}`.trim();
  return (
    <div className="dbv-kit-input-wrapper">
      <input className={classNameToApply} {...props} />
    </div>
  );
};
