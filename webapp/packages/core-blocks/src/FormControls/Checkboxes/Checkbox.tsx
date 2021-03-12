/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useContext, useState } from 'react';

import type { IGridItemsLayoutProps } from '../../Containers/LayoutProps';
import { FormContext } from '../FormContext';
import { isControlPresented } from '../isControlPresented';
import { CheckboxMarkup } from './CheckboxMarkup';

export type CheckboxMod = 'primary' | 'menu';

export type CheckboxBaseProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'value' | 'checked'> & IGridItemsLayoutProps & {
  value?: string;
  checkboxLabel?: string;
  long?: boolean;
  mod?: CheckboxMod[];
  showRipple?: boolean;
};

type CheckboxOnChangeEvent<T> =
  ((value: boolean, name: T) => void) |
  ((value: boolean, name: T) => boolean);

export type CheckboxControlledProps = CheckboxBaseProps & {
  checked?: boolean;
  indeterminate?: boolean;
  onChange?: CheckboxOnChangeEvent<string | undefined>;
  state?: never;
  autoHide?: never;
};

export type CheckboxObjectProps<TKey extends keyof TState, TState> = CheckboxBaseProps & {
  name: TKey;
  state: TState;
  onChange?: CheckboxOnChangeEvent<TKey>;
  checked?: never;
  indeterminate?: boolean;
  autoHide?: boolean;
};

export interface CheckboxType {
  (props: CheckboxControlledProps): React.ReactElement<any, any> | null;
  <TKey extends keyof TState, TState>(props: CheckboxObjectProps<TKey, TState>): React.ReactElement<any, any> | null;
}

export const Checkbox: CheckboxType = observer(function Checkbox({
  name,
  value,
  state,
  checkboxLabel,
  checked: checkedControlled,
  children,
  mod,
  showRipple,
  className,
  long,
  autoHide,
  onChange,
  ...rest
}: CheckboxControlledProps | CheckboxObjectProps<any, any>) {
  const [count, refresh] = useState(0);
  const context = useContext(FormContext);
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (state) {
      if (Array.isArray(state[name])) {
        state[name] = (state[name] as string[]).filter(item => item !== value);
        if (event.target.checked) {
          state[name].push(value);
        }
      } else {
        state[name] = event.target.checked;
      }
    }
    if (onChange) {
      const checked = onChange(event.target.checked, name);

      if (typeof checked === 'boolean') {
        event.target.checked = checked;
      }
    }
    if (context) {
      context.onChange(event.target.checked, name);
    }
    refresh(count + 1);
  }, [state, name, value, onChange, context, count]);

  if (autoHide && !isControlPresented(name, state)) {
    return null;
  }

  let checked = checkedControlled;

  if (state) {
    if (typeof state[name] === 'string') {
      checked = state[name] === 'true';
    } else {
      checked = state[name];
    }
  }

  if (Array.isArray(checked)) {
    checked = checked.includes(value);
  }

  return (
    <CheckboxMarkup
      {...rest}
      name={name}
      id={value || name}
      checked={checked}
      label={checkboxLabel}
      className={className}
      mod={mod}
      showRipple={showRipple}
      onChange={handleChange}
    />
  );
});
