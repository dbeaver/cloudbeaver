/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { clsx } from 'clsx';
import './IconButton.css';
import { ButtonBase, type ButtonProps } from './Button.js';
import { componentProviderWrapper } from '../componentProviderWrapper.js';

export interface IconButtonProps extends ButtonProps {
  'aria-label': string;
}

export function IconButtonBase({ className, variant = 'primary', size = 'medium', children, 'aria-label': ariaLabel, ...props }: IconButtonProps) {
  const classToApply = clsx('dbv-kit-icon-button', className);

  return (
    <ButtonBase className={classToApply} variant={variant} size={size} aria-label={ariaLabel} {...props}>
      <span className="dbv-kit-icon-button__icon">{children}</span>
    </ButtonBase>
  );
}

export const IconButton = componentProviderWrapper('IconButton', IconButtonBase);
