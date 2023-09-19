/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import type { ComponentStyle } from '@cloudbeaver/core-theming';

import style from './Button.m.css';
import { IconOrImage } from './IconOrImage';
import { Loader } from './Loader/Loader';
import { s } from './s';
import { useObjectRef } from './useObjectRef';
import { useObservableRef } from './useObservableRef';
import { useS } from './useS';
import { useStyles } from './useStyles';

type buttonMod = Array<'raised' | 'unelevated' | 'outlined' | 'secondary'>;

type buttonModMap = {
  [key in buttonMod[number]]: boolean;
};

type ButtonProps = (React.ButtonHTMLAttributes<HTMLButtonElement | HTMLAnchorElement> &
  React.LinkHTMLAttributes<HTMLLinkElement | HTMLButtonElement> &
  React.HTMLAttributes<HTMLDivElement>) & {
  loading?: boolean;
  icon?: string;
  viewBox?: string;
  styles?: ComponentStyle;
  mod?: buttonMod;
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
  styles: oldStyles,
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

  const modMap = mod?.reduce((map, mod) => {
    map[mod] = true;
    return map;
  }, {} as buttonModMap);

  const Button = tag;
  return styled(useStyles(oldStyles))(
    <Button
      {...rest}
      type={type}
      disabled={disabled}
      {...use({ loading })}
      className={s(
        styles,
        {
          button: true,
          raised: modMap?.raised,
          outlined: modMap?.outlined,
          secondary: modMap?.secondary,
          unelevated: modMap?.unelevated,
          loading,
        },
        className,
      )}
      onClick={state.click}
    >
      <div className={s(styles, { ripple: true })} />
      {icon && (
        <div className={s(styles, { buttonIcon: true, disabled }, className)}>
          <IconOrImage icon={icon} viewBox={viewBox} />
        </div>
      )}
      <span className={s(styles, { buttonLabel: true }, className)}>{children}</span>
      <Loader className={s(styles, { loader: true })} small />
    </Button>,
  );
});
