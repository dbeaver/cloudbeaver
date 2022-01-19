/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { filterLayoutFakeProps } from '../../Containers/filterLayoutFakeProps';
import type { ILayoutSizeProps } from '../../Containers/ILayoutSizeProps';
import { isControlPresented } from '../isControlPresented';
import { CheckboxMarkup, CheckboxMod } from './CheckboxMarkup';
import { CheckboxOnChangeEvent, useCheckboxState } from './useCheckboxState';

export interface CheckboxBaseProps {
  mod?: CheckboxMod[];
  ripple?: boolean;
  indeterminate?: boolean;
  style?: ComponentStyle;
}

export type CheckboxInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'value' | 'defaultValue' | 'checked' | 'defaultChecked' | 'style'> & ILayoutSizeProps & {
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

export interface CheckboxType {
  (props: CheckboxBaseProps & ICheckboxControlledProps): React.ReactElement<any, any> | null;
  <TKey extends string>(props: CheckboxBaseProps & ICheckboxObjectProps<TKey>): React.ReactElement<any, any> | null;
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
  mod,
  ripple,
  className,
  autoHide,
  onChange,
  ...rest
}: CheckboxBaseProps & (ICheckboxControlledProps | ICheckboxObjectProps<any>)) {
  rest = filterLayoutFakeProps(rest);
  const checkboxState = useCheckboxState({
    value,
    defaultValue,
    checked,
    defaultChecked,
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
      checked={checkboxState.checked}
      label={label}
      className={className}
      mod={mod}
      ripple={ripple}
      onChange={checkboxState.change}
    />
  );
});
