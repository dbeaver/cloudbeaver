/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';
import styled, { use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { baseFormControlStyles } from './baseFormControlStyles';

type BaseProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'name' | 'value'> & {
  mod?: 'surface';
}

type ControlledProps = BaseProps & {
  name?: string;
  value?: string;
  onChange?(value: string, name?: string): any;

  state?: never;
}

type ObjectProps<TKey extends keyof TState, TState> = BaseProps & {
  name: TKey;
  state: TState;
  onChange?(value: string, name: TKey): any;

  value?: never;
}

type InputFieldType = {
  (props: ControlledProps): JSX.Element;
  <TKey extends keyof TState, TState>(props: ObjectProps<TKey, TState>): JSX.Element;
}

export const InputField: InputFieldType = observer(function InputField(
  props: ControlledProps | ObjectProps<any, any>
) {
  const {
    name,
    required,
    state,
    children,
    className,
    mod,
    onChange,
    ...rest
  } = props;

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (state) {
      state[name] = event.target.value;
    }
    if (onChange) {
      onChange(event.target.value, name);
    }
  }, [state, name, onChange]);

  const value = state ? state[name] : props.value;

  return styled(useStyles(baseFormControlStyles))(
    <field as="div" className={className}>
      <field-label as='label'>{children} {required && '*'}</field-label>
      <input
        {...rest}
        onChange={handleChange}
        name={name}
        value={value}
        {...use({ mod })}
        required={required}
      />
    </field>
  );
});
