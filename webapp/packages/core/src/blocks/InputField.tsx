/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css, use } from 'reshadow';

import { useStyles } from '@dbeaver/core/theming';

const styles = css`
  label {
    composes: theme-typography--body1 from global;
  }
  field {
    display: flex;
    flex: auto;
    box-sizing: border-box;
    align-items: center;
    padding: 12px 0;

    & label {
      width: 150px;
      text-align: right;
      padding: 0 12px;
      line-height: 16px;
      font-weight: 500;

      &:empty {
        display: none;
      }
    }
    & input {
      flex: 1;
      margin: 0 12px;
      height: 26px;
    }
  }
`;

type InputFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  mod?: 'surface';
  onChange?(value: string): any;
}

export function InputField({
  children,
  className,
  mod,
  onChange = () => {},
  ...rest
}: InputFieldProps) {

  return styled(useStyles(styles))(
    <field as="div" className={className}>
      <label>{children}</label>
      <input onChange={e => onChange(e.target.value)} {...rest} {...use({ mod })} />
    </field>
  );
}
