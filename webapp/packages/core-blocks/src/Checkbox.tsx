/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css, use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

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
      width: 230px;
      text-align: right;
      padding: 0 12px;
      line-height: 16px;
      font-weight: 500;
    }
    & input {
      flex: 1;
      margin: 0 12px;
      height: 26px;
    }
    & checkbox {
      display: flex;
      align-items: center;
    }
  }
`;

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  checkboxLabel: string;
  mod?: 'surface';
  onChange?(value: boolean): any;
}

export function Checkbox({
  checkboxLabel,
  children,
  className,
  mod,
  onChange = () => {},
  ...rest
}: Props) {

  return styled(useStyles(styles))(
    <field as="div" className={className}>
      <label>{children}</label>
      <checkbox as='div'>
        <input onChange={e => onChange(e.target.checked)} {...rest} {...use({ mod })} />
        <checkbox-label as='div'>{checkboxLabel}</checkbox-label>
      </checkbox>
    </field>
  );
}
