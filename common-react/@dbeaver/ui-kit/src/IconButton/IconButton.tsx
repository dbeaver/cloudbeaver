/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { clsx } from 'clsx';

import { componentProviderWrapper } from '../componentProviderWrapper.js';
import { ButtonRoot, type ButtonRootProps } from '../Button/ButtonRoot.js';
import type { ControlSize } from '../types/controls.js';

import './IconButton.css';

export interface IconButtonProps extends ButtonRootProps {
  'aria-label': string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: ControlSize;
}

export function IconButtonBase({ className, variant = 'primary', size = 'medium', children, ...props }: IconButtonProps) {
  const classToApply = clsx('dbv-kit-icon-button', `dbv-kit-icon-button--${variant}`, `dbv-kit-icon-button--${size}`, className);

  return (
    <ButtonRoot className={classToApply} {...props}>
      <span className="dbv-kit-icon-button__icon">{children}</span>
    </ButtonRoot>
  );
}

export const IconButton = componentProviderWrapper('IconButton', IconButtonBase);
