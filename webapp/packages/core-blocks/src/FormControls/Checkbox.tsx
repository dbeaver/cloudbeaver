/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';
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

type BaseProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'value' | 'checked'> & {
  value?: string;
  checkboxLabel: string;
  mod?: 'surface';
  long?: boolean;
}

type ControlledProps = BaseProps & {
  checked?: boolean;
  onChange?(value: boolean, name?: string): any;

  state?: never;
}

type ObjectProps<TKey extends keyof TState, TState> = BaseProps & {
  name: TKey;
  state: TState;
  onChange?(value: boolean, name: TKey): any;

  checked?: never;
}

type CheckboxType = {
  (props: ControlledProps): JSX.Element;
  <TKey extends keyof TState, TState>(props: ObjectProps<TKey, TState>): JSX.Element;
}

export const Checkbox: CheckboxType = observer(function Checkbox(
  props: ControlledProps | ObjectProps<any, any>
) {
  const {
    name,
    value,
    state,
    checkboxLabel,
    children,
    className,
    mod,
    long,
    onChange,
    ...rest
  } = props;

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (state) {
      state[name] = event.target.checked;
    }
    if (onChange) {
      onChange(event.target.checked, name);
    }
  }, [state, name, onChange]);

  const checked = state ? state[name] : props.checked;

  return styled(useStyles(baseFormControlStyles, styles))(
    <field as="div" className={className} {...use({ long })}>
      <field-label as="div">{children}</field-label>
      <checkbox as='div'>
        <input
          {...rest}
          name={name}
          id={value || name}
          type='checkbox'
          onChange={handleChange}
          checked={checked}
          {...use({ mod })}
        />
        <label htmlFor={value || name}>{checkboxLabel}</label>
      </checkbox>
    </field>
  );
});
