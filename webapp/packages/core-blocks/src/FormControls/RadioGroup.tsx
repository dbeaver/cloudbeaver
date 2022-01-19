/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import {
  useCallback, useMemo, useState, useContext
} from 'react';

import { FormContext } from './FormContext';
import { RadioGroupContext, IRadioGroupContext } from './RadioGroupContext';

type BaseProps = React.PropsWithChildren<{
  name: string;
}>;

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
  <T>(props: ControlledProps<T>): JSX.Element;
  <TKey extends keyof TState, TState>(props: ObjectProps<TKey, TState>): JSX.Element;
}

export const RadioGroup: RadioGroupType = observer(function RadioGroup({
  name,
  value: controlledValue,
  state,
  onChange,
  children,
}: ControlledProps<string | number> | ObjectProps<any, any>) {
  const formContext = useContext(FormContext);
  const [selfValue, setValue] = useState<string | number>();

  const handleChange = useCallback((value: string | number) => {
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
  }, [name, state, formContext, onChange]);

  const value = state ? state[name] : controlledValue ?? selfValue;

  const context: IRadioGroupContext = useMemo(() => ({
    name,
    value,
    onChange: handleChange,
  }), [value, value, handleChange]);

  return (
    <RadioGroupContext.Provider value={context}>
      {children}
    </RadioGroupContext.Provider>
  );
});
