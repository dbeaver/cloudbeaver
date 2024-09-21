/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { isControlPresented } from '../isControlPresented.js';
import { CheckboxMarkup, type CheckboxMod } from './CheckboxMarkup.js';
import { type CheckboxOnChangeEvent, useCheckboxState } from './useCheckboxState.js';

export interface CheckboxBaseProps {
  caption?: string;
  mod?: CheckboxMod[];
  ripple?: boolean;
  indeterminate?: boolean;
  inverse?: boolean;
}

export type CheckboxInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'type' | 'value' | 'defaultValue' | 'checked' | 'defaultChecked' | 'style'
> & {
  value?: string;
  defaultValue?: string;
  defaultChecked?: boolean;
  label?: string;
};

export interface ICheckboxControlledProps extends CheckboxInputProps {
  state?: never;
  checked?: boolean;
  onChange?: CheckboxOnChangeEvent<string | undefined>;
  autoHide?: never;
}

export interface ICheckboxObjectProps<TKey extends string> extends CheckboxInputProps {
  state: Partial<Record<TKey, boolean | null | string | string[]>>;
  checked?: never;
  onChange?: CheckboxOnChangeEvent<TKey>;
  autoHide?: boolean;
  name: TKey;
}

export interface CheckboxType<P = NonNullable<unknown>> {
  (props: CheckboxBaseProps & ICheckboxControlledProps & P): React.ReactElement<any, any> | null;
  <TKey extends string>(props: CheckboxBaseProps & ICheckboxObjectProps<TKey> & P): React.ReactElement<any, any> | null;
}

export const Checkbox: CheckboxType = observer(function Checkbox({
  name,
  value,
  defaultValue,
  state,
  label,
  checked,
  defaultChecked,
  children,
  inverse,
  mod,
  ripple,
  className,
  autoHide,
  onChange,
  ...rest
}: CheckboxBaseProps & (ICheckboxControlledProps | ICheckboxObjectProps<any>)) {
  const checkboxState = useCheckboxState({
    value,
    defaultValue,
    checked,
    defaultChecked,
    state,
    name,
    inverse,
    onChange,
  });

  if (autoHide && !isControlPresented(name, state)) {
    return null;
  }

  return (
    <CheckboxMarkup
      {...rest}
      name={name}
      checked={checkboxState.checked}
      label={label}
      className={className}
      mod={mod}
      ripple={ripple}
      onChange={checkboxState.change}
    />
  );
});
