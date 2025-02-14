/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Button as AriaButton, type ButtonProps } from '@ariakit/react';
import './Button.css';

export interface UiKitButtonProps extends Omit<ButtonProps, 'clickOnEnter' | 'clickOnSpace'> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  loading?: boolean;
}

export function Button({ className, variant = 'primary', size = 'medium', loading, children, onClick, ...props }: UiKitButtonProps) {
  const classToApply = `dbv-ui-button dbv-ui-button--${variant} dbv-ui-button--${size}` + (className ? ` ${className}` : '');

  return (
    <AriaButton aria-label={loading ? 'Loading' : ''} onClick={loading ? () => null : onClick} className={classToApply} {...props}>
      {loading && <span className="dbv-ui-button-loader" />}
      {children}
    </AriaButton>
  );
}

export interface ButtonIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  position?: 'left' | 'right';
}

Button.Icon = function ButtonIcon({ className, children, position }: ButtonIconProps) {
  const classToApply = `dbv-ui-button-icon` + (position ? ` dbv-ui-button-icon--${position}` : '') + (className ? ` ${className}` : '');
  return <span className={classToApply}>{children}</span>;
};
