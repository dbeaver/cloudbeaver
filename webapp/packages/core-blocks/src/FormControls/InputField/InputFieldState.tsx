/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { forwardRef } from 'react';

import type { IFormStateControl } from '../IFormStateControl';
import { useFormStateControl } from '../useFormStateControl';
import { InputFieldBase, InputFieldBaseProps } from './InputFieldBase';

export type InputFieldStateProps<TState extends Record<string, any>, TKey extends keyof TState> = Omit<InputFieldBaseProps, 'value'> &
  IFormStateControl<TState, TKey>;

interface InputFieldType {
  <TState extends Record<string, any>, TKey extends keyof TState>(props: InputFieldStateProps<TState, TKey>): React.ReactElement<any, any> | null;
}

export const InputFieldState: InputFieldType = observer<InputFieldStateProps<any, any>, HTMLInputElement>(
  forwardRef(function InputFieldState({ name, state, defaultState, mapState, mapValue, autoHide, onChange, ...rest }, ref) {
    const controlState = useFormStateControl({ name, defaultState, state, autoHide, mapState, mapValue, onChange });

    if (controlState.hide) {
      return null;
    }

    return (
      <InputFieldBase
        ref={ref}
        name={name}
        value={controlState.stringValue ?? controlState.defaultValue ?? ''}
        onChange={controlState.onChange}
        {...rest}
      />
    );
  }),
) as InputFieldType;
