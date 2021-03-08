/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';
import { use } from 'reshadow';

import { useStyles, composes } from '@cloudbeaver/core-theming';

import { Loader } from './Loader/Loader';

const buttonStyles = composes(
  css`
    Button {
      composes: theme-button from global;
    }
    ripple {
      composes: theme-button_ripple from global;
    }
  `,
  css`
    Button {
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
    }
    
  `
);

const buttonMod = {
  raised: composes(
    css`
    Button {
      composes: theme-button_raised from global;
    }
    `
  ),
  unelevated: composes(
    css`
    Button {
      composes: theme-button_unelevated from global;
    }
    `
  ),
  outlined: composes(
    css`
    Button {
      composes: theme-button_outlined from global;
    }
    `
  ),
  secondary: composes(
    css`
    Button {
      composes: theme-button_secondary from global;
    }
    `
  ),
};

type ButtonProps = (
  React.ButtonHTMLAttributes<HTMLButtonElement | HTMLAnchorElement>
  & React.LinkHTMLAttributes<HTMLLinkElement | HTMLButtonElement>
) & {
  loading?: boolean;
  mod?: Array<keyof typeof buttonMod>;
  tag?: 'button' | 'a';
  href?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
  download?: boolean;
};

export const Button: React.FC<ButtonProps> = function Button({
  children,
  mod,
  tag = 'button',
  disabled = false,
  loading,
  ...rest
}) {
  if (loading) {
    disabled = true;
  }

  const Button = tag;
  return styled(useStyles(buttonStyles, ...(mod || []).map(mod => buttonMod[mod])))(
    <Button {...rest} disabled={disabled} {...use({ loading })}>
      <ripple as="div" />
      <button-label as='div'>{children}</button-label>
      <Loader small />
    </Button>
  );
};
