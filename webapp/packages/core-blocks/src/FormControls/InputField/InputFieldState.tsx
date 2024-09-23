/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { forwardRef } from 'react';

import type { IFormStateControl } from '../IFormStateControl.js';
import { useFormStateControl } from '../useFormStateControl.js';
import { InputFieldBase, type InputFieldBaseProps } from './InputFieldBase.js';

export type InputFieldStateProps<TState extends Record<string, any>, TKey extends keyof TState> = Omit<InputFieldBaseProps, 'value'> &
  IFormStateControl<TState, TKey>;

interface InputFieldType {
  <TState extends Record<string, any>, TKey extends keyof TState>(
    props: InputFieldStateProps<TState, TKey> & React.RefAttributes<HTMLInputElement>,
  ): React.ReactElement<any, any> | null;
}

export const InputFieldState: InputFieldType = observer<InputFieldStateProps<any, any>, HTMLInputElement>(
  forwardRef(function InputFieldState({ name, state, defaultState, mapState, mapValue, autoHide, onChange, ...rest }, ref) {
    const controlState = useFormStateControl({ name, defaultState, state, autoHide, mapState, mapValue, onChange });

    if (controlState.hide) {
      return null;
    }

    const defaultValue = rest.type === 'password' ? null : controlState.defaultStringValue;

    return <InputFieldBase {...rest} ref={ref} name={name} value={controlState.stringValue ?? defaultValue ?? ''} onChange={controlState.onChange} />;
  }),
) as InputFieldType;
