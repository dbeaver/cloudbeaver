/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Button as AriaButton, type ButtonProps } from '@ariakit/react';
import './Button.css';

interface UiKitButtonProps extends ButtonProps {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

export function Button({ className, variant = 'primary', loading, children, onClick, ...props }: UiKitButtonProps) {
  const classToApply = `btn btn-${variant}`;

  return (
    <AriaButton onClick={loading ? () => null : onClick} className={(className ? className : '') + ' ' + classToApply} {...props}>
      {loading && <span className="btn-loader" />}
      {children}
    </AriaButton>
  );
}
