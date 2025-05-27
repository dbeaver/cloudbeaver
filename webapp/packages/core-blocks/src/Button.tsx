/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createElement } from 'react';
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Button as UIKitButton, ButtonIcon } from '@dbeaver/ui-kit';

import { IconOrImage } from './IconOrImage.js';
import { useObjectRef } from './useObjectRef.js';
import { useObservableRef } from './useObservableRef.js';

import './Button.css';

export type ButtonProps = (React.ButtonHTMLAttributes<HTMLButtonElement | HTMLAnchorElement> &
  React.LinkHTMLAttributes<HTMLLinkElement | HTMLButtonElement> &
  React.HTMLAttributes<HTMLDivElement>) & {
  loading?: boolean;
  icon?: string;
  viewBox?: string;
  iconPlacement?: 'start' | 'end';
  iconSize?: number;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  tag?: 'button' | 'a' | 'div';
  href?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
  loader?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement | HTMLLinkElement | HTMLDivElement> | (() => Promise<any>);
  download?: boolean;
};

export const Button = observer<ButtonProps>(function Button({
  children,
  icon,
  viewBox,
  tag = 'button',
  type = 'button',
  disabled = false,
  loading,
  loader,
  onClick,
  className,
  iconPlacement,
  iconSize = 16,
  ...rest
}) {
  const handlersRef = useObjectRef({ onClick });
  const state = useObservableRef(
    () => ({
      loading: false,
      click(e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement | HTMLLinkElement | HTMLDivElement>) {
        const returnValue = handlersRef.onClick?.(e);

        if (returnValue instanceof Promise) {
          if (loader) {
            this.loading = true;
            returnValue.finally(() => {
              this.loading = false;
            });
          }
        }
      },
    }),
    {
      loading: observable.ref,
    },
    false,
    ['click'],
  );

  loading = state.loading || loading;

  if (loading) {
    disabled = true;
  }

  const Tag = createElement(tag);
  return (
    <UIKitButton render={Tag} {...rest} loading={loading} type={type} disabled={disabled} className={className} onClick={state.click}>
      {icon && (
        <ButtonIcon placement={iconPlacement}>
          <IconOrImage width={iconSize} icon={icon} viewBox={viewBox} />
        </ButtonIcon>
      )}
      {children}
    </UIKitButton>
  );
});
