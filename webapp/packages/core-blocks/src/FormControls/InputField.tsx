/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useContext } from 'react';
import styled, { use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { baseFormControlStyles } from './baseFormControlStyles';
import { FormContext } from './FormContext';
import { isControlPresented } from './isControlPresented';

type BaseProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'name' | 'value'> & {
  description?: string;
  mod?: 'surface';
  long?: boolean;
  short?: boolean;
};

type ControlledProps = BaseProps & {
  name?: string;
  value?: string;
  onChange?: (value: string, name?: string) => any;
  state?: never;
  autoHide?: never;
};

type ObjectProps<TKey extends keyof TState, TState> = BaseProps & {
  name: TKey;
  state: TState;
  onChange?: (value: string, name: TKey) => any;
  autoHide?: boolean;
  value?: never;
};

interface InputFieldType {
  (props: ControlledProps): React.ReactElement<any, any> | null;
  <TKey extends keyof TState, TState>(props: ObjectProps<TKey, TState>): React.ReactElement<any, any> | null;
}

export const InputField: InputFieldType = observer(function InputField({
  name,
  value: valueControlled,
  defaultValue,
  required,
  state,
  children,
  className,
  description,
  mod,
  long,
  short,
  autoHide,
  onChange,
  ...rest
}: ControlledProps | ObjectProps<any, any>) {
  const styles = useStyles(baseFormControlStyles);
  const context = useContext(FormContext);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (state) {
      state[name] = event.target.value;
    }
    if (onChange) {
      onChange(event.target.value, name);
    }
    if (context) {
      context.change(event.target.value, name);
    }
  }, [state, name, context, onChange]);

  let value: any = valueControlled ?? defaultValue ?? undefined;

  if (state && name !== undefined && name in state) {
    value = state[name];
  }

  if (autoHide && !isControlPresented(name, state, defaultValue)) {
    return null;
  }

  return styled(styles)(
    <field as="div" className={className} {...use({ long, short })}>
      <field-label as='label' title={rest.title}>{children} {required && '*'}</field-label>
      <input
        {...rest}
        name={name}
        value={value ?? ''}
        onChange={handleChange}
        {...use({ mod })}
        required={required}
      />
      {description && (
        <field-description as='div'>
          {description}
        </field-description>
      )}
    </field>
  );
});
