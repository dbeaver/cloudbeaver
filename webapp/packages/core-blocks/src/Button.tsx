/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { useStyles, ComponentStyle } from '@cloudbeaver/core-theming';

import { Icon } from './Icon';
import { Loader } from './Loader/Loader';
import { useObservableRef } from './useObservableRef';

const buttonStyles = css`
    button-label {
      composes: theme-button__label from global;
    }
    button-icon {
      composes: theme-button__icon from global;
    }
    ripple {
      composes: theme-button_ripple from global;
    }
    Button {
      composes: theme-button from global;
      display: flex;

      & Loader, & button-label {
        transition: opacity cubic-bezier(0.4, 0.0, 0.2, 1) 0.3s;
      }

      & Loader {
        position: absolute;
        opacity: 0;
      }

      & button-label {
        opacity: 1;
      }

      &[|loading] {
        & Loader {
          opacity: 1;
        }

        & button-label {
          opacity: 0;
        }
      }

      &[href] {
        text-decoration: none;
      }
    }
    
  `;

const buttonMod = {
  raised: css`
    Button {
      composes: theme-button_raised from global;
    }
    `,
  unelevated: css`
    Button {
      composes: theme-button_unelevated from global;
    }
    `,
  outlined: css`
    Button {
      composes: theme-button_outlined from global;
    }
    `,
  secondary: css`
    Button {
      composes: theme-button_secondary from global;
    }
    `,
};

type ButtonProps = (
  React.ButtonHTMLAttributes<HTMLButtonElement | HTMLAnchorElement>
  & React.LinkHTMLAttributes<HTMLLinkElement | HTMLButtonElement>
  & React.HTMLAttributes<HTMLDivElement>
) & {
  loading?: boolean;
  icon?: string;
  viewBox?: string;
  styles?: ComponentStyle;
  mod?: Array<keyof typeof buttonMod>;
  tag?: 'button' | 'a' | 'div';
  href?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
  loader?: boolean;
  onClick?: React.MouseEventHandler<
  HTMLButtonElement | HTMLAnchorElement | HTMLLinkElement | HTMLDivElement
  > | (() => Promise<any>);
  download?: boolean;
};

export const Button = observer<ButtonProps>(function Button({
  children,
  icon,
  viewBox,
  mod,
  styles,
  tag = 'button',
  disabled = false,
  loading,
  loader,
  onClick,
  className,
  ...rest
}) {
  const state = useObservableRef(() => ({
    loading: false,
  }), {
    loading: observable.ref,
  }, {
    click(e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement | HTMLLinkElement | HTMLDivElement>) {
      const returnValue = onClick?.(e);

      if (returnValue instanceof Promise) {
        if (loader) {
          this.loading = true;
          returnValue.finally(() => {
            this.loading = false;
          });
        }
      }
    },
  }, ['click']);

  loading = state.loading || loading;

  if (loading) {
    disabled = true;
  }

  const Button = tag;
  return styled(useStyles(styles, buttonStyles, ...(mod || []).map(mod => buttonMod[mod])))(
    <Button {...rest} disabled={disabled} {...use({ loading })} className={className} onClick={state.click}>
      <ripple />
      {icon && <button-icon><Icon name={icon} viewBox={viewBox} /></button-icon>}
      <button-label as='span'>{children}</button-label>
      <Loader small />
    </Button>
  );
});
