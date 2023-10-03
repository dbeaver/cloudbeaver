/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useContext, useEffect, useRef } from 'react';

import { ExecutorInterrupter } from '@cloudbeaver/core-executor';

import { useExecutor } from '../useExecutor';
import { FormContext } from './FormContext';

export function useCustomInputValidation<T = void>(validation: (value: T) => string | null): React.RefObject<HTMLInputElement> {
  const context = useContext(FormContext);
  const inputRef = useRef<HTMLInputElement>(null);

  useExecutor({
    executor: context?.onValidate,
    handlers: [
      function validationHandler(_, context) {
        if (!inputRef.current) {
          return;
        }

        let value: T = undefined as unknown as T;

        if (inputRef.current instanceof HTMLInputElement) {
          value = inputRef.current.value as unknown as T;
        }

        const result = validation(value);

        if (typeof result === 'string') {
          inputRef.current.setCustomValidity(result);
          ExecutorInterrupter.interrupt(context);
        } else {
          inputRef.current?.setCustomValidity('');
        }
      },
    ],
  });

  useEffect(() => {
    const element = inputRef.current;
    if (!element) {
      return;
    }

    function resetValidationMessage() {
      element?.setCustomValidity('');
    }

    element.addEventListener('input', resetValidationMessage);

    return () => {
      element?.removeEventListener('input', resetValidationMessage);
    };
  });

  return inputRef;
}
