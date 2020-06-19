/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { useStyles, composes } from '@cloudbeaver/core-theming';

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
  mod?: (keyof typeof buttonMod)[];
  tag?: 'button' | 'a';
  href?: string;
  download?: boolean;
}

export function Button({
  children,
  mod,
  tag = 'button',
  ...rest
}: ButtonProps) {
  const Button = tag;
  return styled(useStyles(buttonStyles, ...(mod || []).map(mod => buttonMod[mod])))(
    <Button {...rest}><ripple as="div"/>{children}</Button>
  );
}
