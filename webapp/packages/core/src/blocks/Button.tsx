/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { ButtonHTMLAttributes } from 'react';
import styled, { css } from 'reshadow';

import { useStyles, composes } from '@dbeaver/core/theming';

const buttonStyles = composes(
  css`
  button {
    composes: theme-button from global;
  }
  ripple {
    composes: theme-button_ripple from global;
  }
  `
);

const buttonMod = {
  raised: composes(
    css`
    button {
      composes: theme-button_raised from global;
    }
    `
  ),
  unelevated: composes(
    css`
    button {
      composes: theme-button_unelevated from global;
    }
    `
  ),
  outlined: composes(
    css`
    button {
      composes: theme-button_outlined from global;
    }
    `
  ),
  secondary: composes(
    css`
    button {
      composes: theme-button_secondary from global;
    }
    `
  ),
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  mod?: (keyof typeof buttonMod)[];
}

export const Button = observer(function Button({ children, mod, ...rest }: ButtonProps) {
  return styled(useStyles(buttonStyles, ...(mod || []).map(mod => buttonMod[mod])))(
    <button {...rest}><ripple as="div"/>{children}</button>
  );
});
