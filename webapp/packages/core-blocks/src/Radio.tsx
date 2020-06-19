/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { useStyles, composes } from '@cloudbeaver/core-theming';

const radioStyles = composes(
  css`
  radio {
    composes: theme-radio from global;
  }
  radio-background {
    composes: theme-radio_background from global;
  }
  input {
    composes: theme-radio_native-control from global;
  }
  radio-outer-circle {
    composes: theme-radio_outer-circle from global;
  }
  radio-inner-circle {
    composes: theme-radio_inner-circle from global;
  }
  radio-ripple {
    composes: theme-radio_ripple from global;
  }
  `,
  css`
    field {
      display: inline-flex;
      align-items: center;
      vertical-align: middle;
    }
  `
);

const radioMod = {
  primary: composes(
    css`
    radio {
      composes: theme-radio_primary from global;
    }
    `
  ),
};

type RadioProps = React.InputHTMLAttributes<HTMLInputElement> & {
  mod?: (keyof typeof radioMod)[];
}

export function Radio({
  mod,
  id,
  className,
  children,
  ...rest
}: RadioProps) {
  return styled(useStyles(radioStyles, ...(mod || []).map(mod => radioMod[mod])))(
    <field as="div" className={className}>
      <radio as="div">
        <input type="radio" id={id} {...rest}/>
        <radio-background as="div">
          <radio-outer-circle as="div"/>
          <radio-inner-circle as="div"/>
        </radio-background>
        <radio-ripple as="div"/>
      </radio>
      <label htmlFor={id}>{children}</label>
    </field>
  );
}
