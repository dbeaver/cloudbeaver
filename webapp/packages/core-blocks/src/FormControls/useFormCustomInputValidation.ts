/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext } from 'react';
import { FormContext, useExecutor, type IFormContext } from '../index.js';
import { useCustomInputValidation, type ICustomInputValidation } from './useCustomInputValidation.js';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';

export function useFormCustomInputValidation<T = void, TType extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement>(
  validation: (value: T) => string | null,
  formContext?: IFormContext,
): ICustomInputValidation<TType> {
  const customValidation = useCustomInputValidation<T, TType>(validation);
  const reactContext = useContext(FormContext);
  const context = formContext ?? reactContext;

  if (!context) {
    throw new Error('useCustomInputValidation must be used within a FormContext provider');
  }

  useExecutor({
    executor: context?.onValidate,
    handlers: [
      function validationHandler(_, context) {
        if (!customValidation.ref.current) {
          return;
        }

        if (!customValidation.revalidateAndReport(customValidation.ref.current)) {
          ExecutorInterrupter.interrupt(context);
        }
      },
    ],
  });

  return customValidation;
}
