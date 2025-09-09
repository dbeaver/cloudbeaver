/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useContext, useEffect, useRef } from 'react';

import { ExecutorInterrupter } from '@cloudbeaver/core-executor';

import { useTranslate } from '../localization/useTranslate.js';
import { useExecutor } from '../useExecutor.js';
import { FormContext } from './FormContext.js';

export function useCustomInputValidation<T = void, TType extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement>(
  validation: (value: T) => string | null,
): React.RefObject<TType | null> {
  const context = useContext(FormContext);
  const inputRef = useRef<TType | null>(null);
  const translate = useTranslate();

  function validate(element: TType): boolean {
    let value: T = undefined as unknown as T;

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      value = element.value as unknown as T;
    }

    const valid = element.validity.valid;
    const result = validation(value);

    try {
      if (typeof result === 'string') {
        element.setCustomValidity(result || translate('core_blocks_custom_input_validation_error'));
        return false;
      }
      element.setCustomValidity('');
      return true;
    } finally {
      if (valid !== element.validity.valid) {
        element.reportValidity();
      }
    }
  }

  useExecutor({
    executor: context?.onValidate,
    handlers: [
      function validationHandler(_, context) {
        if (!inputRef.current) {
          return;
        }

        if (!validate(inputRef.current)) {
          ExecutorInterrupter.interrupt(context);
        }
      },
    ],
  });

  useEffect(() => {
    const element = inputRef.current;
    if (!element) {
      return;
    }

    function handleInput(event: Event) {
      const target = event.target as TType;
      if (target.validity.valid === false) {
        validate(target);
      }
    }

    function handleBlur(event: Event) {
      const target = event.target as TType;
      if (target.validity.valid === true) {
        validate(target);
      }
    }

    element.addEventListener('input', handleInput);
    element.addEventListener('blur', handleBlur);

    return () => {
      element?.removeEventListener('input', handleInput);
      element?.removeEventListener('blur', handleBlur);
    };
  });

  return inputRef;
}
