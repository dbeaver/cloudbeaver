/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useContext } from 'react';

import { filterLayoutFakeProps, getLayoutProps } from '../Containers/filterLayoutFakeProps.js';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import { Field } from './Field.js';
import { FormContext } from './FormContext.js';
import style from './Radio.module.css';
import { RadioGroupContext } from './RadioGroupContext.js';

type BaseProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'checked'> &
  ILayoutSizeProps & {
    mod?: Array<'primary' | 'small' | 'menu'>;
    ripple?: boolean;
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
  mod,
  ripple = true,
  className,
  children,
  ...rest
}: ControlledProps | ObjectProps<any, any>) {
  const styles = useS(style);

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
    <Field {...layoutProps} className={s(styles, { field: true, menu: mod?.includes('menu') }, className)}>
      <div
        className={s(styles, {
          radio: true,
          primary: mod?.includes('primary'),
          small: mod?.includes('small') || mod?.includes('menu'),
          disabledRadio: rest.disabled,
          radioNoRipple: !ripple,
        })}
      >
        <input
          {...rest}
          className={s(styles, { input: true, disabledInput: rest.disabled })}
          type="radio"
          id={id}
          name={name}
          value={value ?? ''}
          checked={checked}
          onChange={handleChange}
        />
        <div className={s(styles, { radioBackground: true })}>
          <div className={s(styles, { radioOuterCircle: true })} />
          <div className={s(styles, { radioInnerCircle: true })} />
        </div>
        {ripple && <div className={s(styles, { radioRipple: true })} />}
      </div>
      <label className={s(styles, { label: true, disabled: rest.disabled })} htmlFor={id}>
        {children}
      </label>
    </Field>
  );
});
