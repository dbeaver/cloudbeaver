/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback, useContext } from 'react';
import styled, { use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { baseFormControlStyles } from './baseFormControlStyles';
import { FormContext } from './FormContext';

type BaseProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'name' | 'value'> & {
  mod?: 'surface';
  long?: boolean;
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

export const InputField: InputFieldType = observer(function InputField({
  name,
  value: valueControlled,
  required,
  state,
  children,
  className,
  mod,
  long,
  onChange,
  ...rest
}: ControlledProps | ObjectProps<any, any>) {
  const context = useContext(FormContext);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (state) {
      state[name] = event.target.value;
    }
    if (onChange) {
      onChange(event.target.value, name);
    }
    if (context) {
      context.onChange(event.target.value, name);
    }
  }, [state, name, context, onChange]);

  const value = state ? state[name] : valueControlled;

  return styled(useStyles(baseFormControlStyles))(
    <field as="div" className={className} {...use({ long })}>
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
