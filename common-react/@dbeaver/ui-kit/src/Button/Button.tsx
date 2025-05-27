/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import clsx from 'clsx';
import type { ControlSize } from '../types/controls.js';
import { componentProviderWrapper } from '../componentProviderWrapper.js';
import { ButtonRoot, type ButtonRootProps } from './ButtonRoot.js';
import './Button.css';

export interface ButtonProps extends ButtonRootProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: ControlSize;
}

export function ButtonBase({ className, variant = 'primary', size = 'medium', ...props }: ButtonProps) {
  const classToApply = clsx('dbv-kit-button', `dbv-kit-button--${variant}`, `dbv-kit-button--${size}`, className);

  return <ButtonRoot className={classToApply} {...props} />;
}
export interface ButtonIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  placement?: 'start' | 'end';
}

/**
 *  Button Icon component - used to place an icon inside a button, renders span element.;
 *
 * @param props.placement This property is needed to adjust icon placement inside a button. The icon with placement="start" will cut the inline-start padding. placement="end" will affect the padding-inline-end accordingly. This property supports RTL and LTR, so you don't need to think about it.
 */
export function ButtonBaseIcon({ className, children, placement }: ButtonIconProps) {
  const classToApply = clsx('dbv-kit-button__icon', placement && `dbv-kit-button__icon--${placement}`, className);
  return <span className={classToApply}>{children}</span>;
}

export const Button = componentProviderWrapper('Button', ButtonBase);
export const ButtonIcon = componentProviderWrapper('ButtonIcon', ButtonBaseIcon);
