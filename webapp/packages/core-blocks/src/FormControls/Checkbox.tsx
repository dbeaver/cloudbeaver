/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css, use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { baseFormControlStyles } from './baseFormControlStyles';

const styles = css`
  checkbox {
    display: flex;
    align-items: center;

    & label {
      padding: 0 12px;
    }

    & input {
      flex: auto 0 0;
      margin: 0;
    }
  }
`;

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'value'> & {
  value?: string;
  checkboxLabel: string;
  mod?: 'surface';
  onChange?(value: boolean): any;
}

export function Checkbox({
  name,
  value,
  checkboxLabel,
  children,
  className,
  mod,
  onChange = () => {},
  ...rest
}: Props) {

  return styled(useStyles(baseFormControlStyles, styles))(
    <field as="div" className={className}>
      <field-label as="div">{children}</field-label>
      <checkbox as='div'>
        <input
          name={name}
          id={value || name}
          type='checkbox'
          onChange={e => onChange(e.target.checked)}
          {...rest}
          {...use({ mod })}
        />
        <label htmlFor={value || name}>{checkboxLabel}</label>
      </checkbox>
    </field>
  );
}
