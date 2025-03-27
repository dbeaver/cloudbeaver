/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ControlSize } from '../types/controls.js';
import { _Radio, type RadioProps as _RadioProps } from './index.js';
import './Radio.css';

export interface RadioProps extends Omit<_RadioProps, 'size'> {
  size?: ControlSize;
}

export function Radio({ children, className, size = 'medium', ...props }: RadioProps) {
  return (
    <label className={`dbv-kit-radio dbv-kit-radio--${size} ${className || ''}`}>
      <_Radio className="dbv-kit-radio__input" {...props} />
      <div className="dbv-kit-radio__control" />
      <span className="dbv-kit-radio__title">{children}</span>
    </label>
  );
}
