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
import { Button as UIKitButton } from '@dbeaver/ui-kit';

import style from './Button.module.css';
import { IconOrImage } from './IconOrImage.js';
import { Loader } from './Loader/Loader.js';
import { s } from './s.js';
import { useObjectRef } from './useObjectRef.js';
import { useObservableRef } from './useObservableRef.js';
import { useS } from './useS.js';

type ButtonMod = Array<'raised' | 'unelevated' | 'outlined' | 'secondary'>;

export type ButtonProps = (React.ButtonHTMLAttributes<HTMLButtonElement | HTMLAnchorElement> &
  React.LinkHTMLAttributes<HTMLLinkElement | HTMLButtonElement> &
  React.HTMLAttributes<HTMLDivElement>) & {
  loading?: boolean;
  icon?: string;
  viewBox?: string;
  mod?: ButtonMod;
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
  mod,
  tag = 'button',
  type = 'button',
  disabled = false,
  loading,
  loader,
  onClick,
  className,
  ...rest
}) {
  const styles = useS(style);
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
    <UIKitButton
      render={Tag}
      {...rest}
      loading={loading}
      loader={
        <Loader className={s(styles, { loader: true })} small />
      }
      type={type}
      disabled={disabled}
      className={s(
        styles,
        {
          button: true,
          raised: mod?.includes('raised'),
          outlined: mod?.includes('outlined'),
          secondary: mod?.includes('secondary'),
          unelevated: mod?.includes('unelevated'),
          loading,
        },
        className,
      )}
      onClick={state.click}
    >
      <div className={s(styles, { ripple: true })} />
      {icon && (
        <div className={s(styles, { buttonIcon: true, disabled })}>
          <IconOrImage icon={icon} viewBox={viewBox} />
        </div>
      )}
      <span className={s(styles, { buttonLabel: true })}>{children}</span>
    </UIKitButton>
  );
});
