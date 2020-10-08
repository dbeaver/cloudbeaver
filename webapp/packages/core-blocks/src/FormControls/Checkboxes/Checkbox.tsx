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

import { FormContext } from '../FormContext';
import { CheckboxMarkup } from './CheckboxMarkup';

export type CheckboxBaseProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'value' | 'checked'> & {
  value?: string;
  checkboxLabel?: string;
  mod?: 'surface';
  long?: boolean;
};

export type CheckboxControlledProps = CheckboxBaseProps & {
  checked?: boolean;
  indeterminate?: boolean;
  onChange?: (value: boolean, name?: string) => any;
  state?: never;
};

export type CheckboxObjectProps<TKey extends keyof TState, TState> = CheckboxBaseProps & {
  name: TKey;
  state: TState;
  onChange?: (value: boolean, name: TKey) => any;
  checked?: never;
  indeterminate?: boolean;
};

export interface CheckboxType {
  (props: CheckboxControlledProps): JSX.Element;
  <TKey extends keyof TState, TState>(props: CheckboxObjectProps<TKey, TState>): JSX.Element;
}

export const Checkbox: CheckboxType = observer(function Checkbox({
  name,
  value,
  state,
  checkboxLabel,
  checked: checkedControlled,
  children,
  className,
  mod,
  long,
  onChange,
  ...rest
}: CheckboxControlledProps | CheckboxObjectProps<any, any>) {
  const context = useContext(FormContext);
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (state) {
      state[name] = event.target.checked;
    }
    if (onChange) {
      onChange(event.target.checked, name);
    }
    if (context) {
      context.onChange(event.target.checked, name);
    }
  }, [state, name, onChange, context]);

  const checked = state ? state[name] : checkedControlled;

  return styled()(
    <CheckboxMarkup
      {...rest}
      name={name}
      id={value || name}
      checked={checked}
      label={checkboxLabel}
      className={className}
      onChange={handleChange}
      {...use({ mod })}
    />
  );
});
