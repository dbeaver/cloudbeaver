/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Button as AriaButton, type ButtonProps } from '@ariakit/react';
import './Button.css';

export interface UiKitButtonProps extends ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  loading?: boolean;
}

export function Button({ className, variant = 'primary', size = 'medium', loading, children, onClick, ...props }: UiKitButtonProps) {
  const classToApply = `btn btn-${variant} btn-${size}`;

  return (
    <AriaButton onClick={loading ? () => null : onClick} className={(className ? className : '') + ' ' + classToApply} {...props}>
      {loading && <span className="btn-loader" />}
      {children}
    </AriaButton>
  );
}
