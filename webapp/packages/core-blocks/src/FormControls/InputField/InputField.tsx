/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { forwardRef, useContext } from 'react';

import { useCombinedHandler } from '../../useCombinedHandler.js';
import { FormContext } from '../FormContext.js';
import { isFormStateControl } from '../isFormStateControl.js';
import { InputFieldBase, type InputFieldBaseProps } from './InputFieldBase.js';
import { InputFieldState, type InputFieldStateProps } from './InputFieldState.js';

interface InputFieldType {
  (props: InputFieldBaseProps & React.RefAttributes<HTMLInputElement>): React.ReactElement<any, any> | null;
  <TState extends Record<string, any>, TKey extends keyof TState>(
    props: InputFieldStateProps<TState, TKey> & React.RefAttributes<HTMLInputElement>,
  ): React.ReactElement<any, any> | null;
}

export const InputField: InputFieldType = observer<InputFieldBaseProps | InputFieldStateProps<any, any>, HTMLInputElement>(
  forwardRef(function InputField({ onChange, onKeyDown, ...rest }, ref) {
    const context = useContext(FormContext);

    const handleChange = useCombinedHandler(onChange, context?.change);
    const handleKeyDown = useCombinedHandler(onKeyDown, context?.keyDown);

    if (isFormStateControl(rest)) {
      return <InputFieldState {...rest} ref={ref} onChange={handleChange} onKeyDown={handleKeyDown} />;
    }

    return <InputFieldBase {...rest} ref={ref} onChange={handleChange} onKeyDown={handleKeyDown} />;
  }),
) as InputFieldType;
