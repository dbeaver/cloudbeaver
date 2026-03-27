/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useContext, useEffect, useRef } from 'react';

import { ExecutorInterrupter } from '@cloudbeaver/core-executor';

import { useTranslate } from '../localization/useTranslate.js';
import { useExecutor } from '../useExecutor.js';
import { FormContext, type IFormContext } from './FormContext.js';

export interface ICustomInputValidation<TType extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement> {
  ref: React.RefObject<TType | null>;
  revalidate: () => void;
}

export function useCustomInputValidation<T = void, TType extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement>(
  validation: (value: T) => string | null,
  formContext?: IFormContext,
): ICustomInputValidation<TType> {
  const reactContext = useContext(FormContext);
  const context = formContext ?? reactContext;
  const inputRef = useRef<TType | null>(null);
  const translate = useTranslate();

  if (!context) {
    throw new Error('useCustomInputValidation must be used within a FormContext provider');
  }

  function validate(element: TType): boolean {
    let value: T = undefined as unknown as T;

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      value = element.value as unknown as T;
    }

    const result = validation(value);

    if (typeof result === 'string') {
      element.setCustomValidity(result || translate('core_blocks_custom_input_validation_error'));
      return false;
    }
    element.setCustomValidity('');
    return true;
  }

  function validateAndReport(element: TType): boolean {
    const valid = element.validity.valid;
    const result = validate(element);

    if (valid !== element.validity.valid) {
      element.reportValidity();
    }

    return result;
  }

  function revalidate() {
    if (inputRef.current) {
      validate(inputRef.current);
    }
  }

  useExecutor({
    executor: context?.onValidate,
    handlers: [
      function validationHandler(_, context) {
        if (!inputRef.current) {
          return;
        }

        if (!validateAndReport(inputRef.current)) {
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
        validateAndReport(target);
      }
    }

    function handleBlur(event: Event) {
      const target = event.target as TType;
      if (target.validity.valid === true) {
        validateAndReport(target);
      }
    }

    element.addEventListener('input', handleInput);
    element.addEventListener('blur', handleBlur);

    return () => {
      element?.removeEventListener('input', handleInput);
      element?.removeEventListener('blur', handleBlur);
    };
  });

  return { ref: inputRef, revalidate };
}
