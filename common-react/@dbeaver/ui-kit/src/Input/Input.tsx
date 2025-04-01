/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { type ComponentPropsWithRef } from 'react';
import './Input.css';
import clsx from 'clsx';

export interface InputProps extends Omit<ComponentPropsWithRef<'input'>, 'size'> {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  label?: React.ReactNode;
}

export const Input: React.FC<InputProps> = function Input({ size, className, ...props }) {
  const classNameToApply = clsx(`dbv-kit-input`, `dbv-kit-input--${size ?? 'medium'}`, className);
  return (
    <label className="dbv-kit-input-wrapper">
      {props.label && <div className={clsx('dbv-kit-input__title', props.required && 'dbv-kit-input__title--required')}>{props.label}</div>}
      <input className={classNameToApply} {...props} />
    </label>
  );
};
