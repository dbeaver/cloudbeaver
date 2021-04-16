/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import type { ComponentStyle } from '@cloudbeaver/core-theming';

import type { ILayoutSizeProps } from '../../Containers/ILayoutSizeProps';
import { isControlPresented } from '../isControlPresented';
import { CheckboxMarkup, CheckboxMod } from './CheckboxMarkup';
import { CheckboxOnChangeEvent, useCheckboxState } from './useCheckboxState';

export interface CheckboxBaseProps {
  label?: string;
  mod?: CheckboxMod[];
  ripple?: boolean;
  indeterminate?: boolean;
  style?: ComponentStyle;
}

export type CheckboxInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'value' | 'checked' | 'id' | 'style'> & ILayoutSizeProps;

export interface ICheckboxControlledProps extends CheckboxInputProps {
  value?: string;
  state?: never;
  checked?: boolean;
  onChange?: CheckboxOnChangeEvent<string | undefined>;
  autoHide?: never;
}

export interface ICheckboxObjectProps<TKey extends string> extends CheckboxInputProps {
  value?: string;
  state: Partial<Record<TKey, boolean | null | string | string[]>>;
  checked?: never;
  onChange?: CheckboxOnChangeEvent<TKey>;
  autoHide?: boolean;
  name: TKey;
}

export interface CheckboxType {
  (props: CheckboxBaseProps & ICheckboxControlledProps): React.ReactElement<any, any> | null;
  <TKey extends string>(props: CheckboxBaseProps & ICheckboxObjectProps<TKey>): React.ReactElement<any, any> | null;
}

export const Checkbox: CheckboxType = observer(function Checkbox({
  name,
  value,
  state,
  label,
  checked,
  children,
  mod,
  ripple,
  className,
  autoHide,
  onChange,
  ...rest
}: CheckboxBaseProps & (ICheckboxControlledProps | ICheckboxObjectProps<any>)) {
  const checkboxState = useCheckboxState({
    value,
    checked,
    defaultChecked: rest.defaultChecked,
    state,
    name,
    onChange,
  });

  if (autoHide && !isControlPresented(name, state)) {
    return null;
  }

  return (
    <CheckboxMarkup
      {...rest}
      name={name}
      id={value || name}
      checked={checkboxState.checked}
      label={label}
      className={className}
      mod={mod}
      ripple={ripple}
      onChange={checkboxState.change}
    />
  );
});
