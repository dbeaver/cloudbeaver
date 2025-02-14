/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Button as AriaButton, type ButtonProps as AriaKitButtonProps } from '@ariakit/react';
import './Button.css';

export interface ButtonProps extends Omit<AriaKitButtonProps, 'clickOnEnter' | 'clickOnSpace'> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  loading?: boolean;
}

export function Button({ className, variant = 'primary', size = 'medium', loading, children, onClick, ...props }: ButtonProps) {
  const classToApply = `dbv-kit-button dbv-kit-button--${variant} dbv-kit-button--${size}` + (className ? ` ${className}` : '');

  return (
    <AriaButton aria-label={loading ? 'Loading' : ''} onClick={loading ? () => null : onClick} className={classToApply} {...props}>
      {loading && <span className="dbv-kit-button-loader" />}
      {children}
    </AriaButton>
  );
}

export interface ButtonIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /* This property is needed to adjust icon placement inside a button. The icon with placement="start" will cut the inline-start padding. placement="end" will affect the padding-inline-end accordingly. This property supports RTL and LTR, so you don't need to think about it. */
  placement?: 'start' | 'end';
}

Button.Icon = function ButtonIcon({ className, children, placement }: ButtonIconProps) {
  const classToApply = `dbv-kit-button-icon` + (placement ? ` dbv-kit-button-icon--${placement}` : '') + (className ? ` ${className}` : '');
  return <span className={classToApply}>{children}</span>;
};
