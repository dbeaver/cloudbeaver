/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { type ComponentPropsWithRef, type ReactElement, useId } from 'react';
import './Input.css';
import clsx from 'clsx';
import { componentProviderWrapper } from '../componentProviderWrapper.js';

export type InputProps = Omit<ComponentPropsWithRef<'input'>, 'size'> & {
    label?: ReactElement | string;
    size?: 'small' | 'medium' | 'large' | 'xlarge';
  };

export const InputBase: React.FC<InputProps> = function Input({ 
  size, 
  className, 
  label, 
  'aria-labelledby': ariaLabelledBy, 
  'aria-label': ariaLabel,
  ...props 
}) {
  const labelId = useId();
  const classNameToApply = clsx(`dbv-kit-input`, `dbv-kit-input--${size ?? 'medium'}`, className);
  
  if (label) {
    return (
      <label className="dbv-kit-input-wrapper">
        <div id={labelId} className={clsx('dbv-kit-input__title', props.required && 'dbv-kit-input__title--required')}>
          {label}
        </div>
        <input 
          className={classNameToApply} 
          aria-labelledby={labelId}
          {...props} 
        />
      </label>
    );
  }
  
  return (
    <input 
      className={classNameToApply} 
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabel}
      {...props} 
    />
  );
};

export const Input = componentProviderWrapper('Input', InputBase);
