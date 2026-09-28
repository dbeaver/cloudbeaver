/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useContext, useId, useState } from 'react';

import { s } from '../s.js';
import { useS } from '../useS.js';
import { Field } from './Field.js';
import { FieldLabel } from './FieldLabel.js';
import { FormContext } from './FormContext.js';
import { RadioGroup as UiKitRadioGroup } from '@dbeaver/ui-kit';
import styles from './RadioGroup.module.css';

type BaseProps = React.PropsWithChildren<React.ComponentProps<typeof UiKitRadioGroup>> & {
  name: string;
};

type ControlledProps<T> = BaseProps & {
  value?: T;
  onChange?: (value: T, name: string) => any;

  state?: never;
};

type ObjectProps<TKey extends keyof TState, TState> = BaseProps & {
  name: TKey;
  state: TState;
  onChange?: (value: TState[TKey], name: TKey) => any;

  value?: never;
};

interface RadioGroupType {
  <T>(props: ControlledProps<T>): React.JSX.Element;
  <TKey extends keyof TState, TState>(props: ObjectProps<TKey, TState>): React.JSX.Element;
}

export const RadioGroup: RadioGroupType = observer(function RadioGroup({
  name,
  value: controlledValue,
  state,
  onChange,
  children,
  label,
  labelledBy,
  'aria-label': ariaLabel,
  required,
  ...rest
}: ControlledProps<string | number> | ObjectProps<any, any>) {
  const formContext = useContext(FormContext);
  const labelId = useId();
  const style = useS(styles);
  const [selfValue, setValue] = useState<string | number>();

  const handleChange = useCallback(
    (value: string | number | null) => {
      if (value === null) {
        return;
      }

      if (state) {
        state[name] = value;
      } else {
        setValue(value);
      }

      if (onChange) {
        onChange(value, name);
      }

      if (formContext) {
        formContext.change(value, name);
      }
    },
    [name, state, formContext, onChange],
  );

  const value = state ? state[name] : (controlledValue ?? selfValue);

  if (label) {
    return (
      <Field>
        <FieldLabel id={labelId} className={s(style, { fieldLabel: true })} required={required}>
          {label}
        </FieldLabel>
        <UiKitRadioGroup {...rest} value={value} setValue={handleChange} labelledBy={labelId} required={required}>
          {children}
        </UiKitRadioGroup>
      </Field>
    );
  }

  if (labelledBy) {
    return (
      <UiKitRadioGroup {...rest} value={value} setValue={handleChange} labelledBy={labelledBy} required={required}>
        {children}
      </UiKitRadioGroup>
    );
  }

  return (
    <UiKitRadioGroup {...rest} value={value} setValue={handleChange} aria-label={ariaLabel!} required={required}>
      {children}
    </UiKitRadioGroup>
  );
});
