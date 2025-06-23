/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useContext } from 'react';

import { filterLayoutFakeProps, getLayoutProps } from '../Containers/filterLayoutFakeProps.js';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps.js';
import { Field } from './Field.js';
import { FormContext } from './FormContext.js';
import { RadioGroupContext } from './RadioGroupContext.js';
import { clsx, Radio as UiKitRadio } from '@dbeaver/ui-kit';
import type { ControlSize } from '@dbeaver/ui-kit/types/controls';
import './Radio.css';

type BaseProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'checked' | 'size'> &
  ILayoutSizeProps & {
    size?: ControlSize;
  };

type ControlledProps = BaseProps & {
  value?: string | number;
  checked?: boolean;
  onChange?: (value: string | number, name: string) => any;
  state?: never;
};

type ObjectProps<TKey extends keyof TState, TState> = BaseProps & {
  name: TKey;
  value: TState[TKey];
  state: TState;
  onChange?: (value: TState[TKey], name: TKey) => any;
  checked?: never;
};

interface RadioType {
  (props: ControlledProps): React.JSX.Element;
  <TKey extends keyof TState, TState>(props: ObjectProps<TKey, TState>): React.JSX.Element;
}

export const Radio: RadioType = observer(function Radio({
  name: controlledName,
  value,
  state,
  id: controlledId,
  checked: controlledChecked,
  onChange,
  className,
  children,
  ...rest
}: ControlledProps | ObjectProps<any, any>) {
  const layoutProps = getLayoutProps(rest);
  rest = filterLayoutFakeProps(rest);
  const formContext = useContext(FormContext);
  const context = useContext(RadioGroupContext);

  const name = context?.name || controlledName;

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.checked) {
        return;
      }

      if (state) {
        state[name] = value;
      }

      if (context) {
        context.onChange(value);
      } else if (formContext) {
        formContext.change(value, name);
      }

      if (onChange) {
        onChange(value, name);
      }
    },
    [value, context, state, name, formContext, onChange],
  );

  const id = controlledId ?? `${name}_${value}`;
  let checked = controlledChecked;

  if (context) {
    checked = context.value === value;
  }

  if (state) {
    checked = state[name] === value;
  }

  return (
    <Field {...layoutProps} className={clsx('radio-field', className)}>
      <UiKitRadio
        id={id}
        name={name}
        value={value?.toString() ?? ''}
        checked={checked}
        onChange={handleChange}
        {...rest}
      >
        {children}
      </UiKitRadio>
    </Field>
  );
});
