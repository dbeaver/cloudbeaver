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
  loader?: React.ReactNode;
}

export function Button({ className, variant = 'primary', size = 'medium', loading, loader, children, onClick, ...props }: ButtonProps) {
  const classToApply = `dbv-kit-button dbv-kit-button--${variant} dbv-kit-button--${size}` + (className ? ` ${className}` : '');

  if (loading) {
    props['aria-busy'] = true;
    props['data-loading'] = true;
  }

  return (
    <AriaButton onClick={loading ? () => null : onClick} className={classToApply} {...props}>
      {loading && (loader ? loader : <span className="dbv-kit-button__loader" />)}
      {children}
    </AriaButton>
  );
}
export interface ButtonIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  placement?: 'start' | 'end';
}

/**
 *  Button Icon component - used to place an icon inside a button, renders span element.;
 *
 * @param props.placement This property is needed to adjust icon placement inside a button. The icon with placement="start" will cut the inline-start padding. placement="end" will affect the padding-inline-end accordingly. This property supports RTL and LTR, so you don't need to think about it.
 */
Button.Icon = function ButtonIcon({ className, children, placement }: ButtonIconProps) {
  const classToApply = `dbv-kit-button__icon` + (placement ? ` dbv-kit-button__icon--${placement}` : '') + (className ? ` ${className}` : '');
  return <span className={classToApply}>{children}</span>;
};
