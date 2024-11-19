/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React, { useContext, useState } from 'react';

import { Executor, ExecutorInterrupter, SyncExecutor } from '@cloudbeaver/core-executor';

import { useExecutor } from '../useExecutor.js';
import { useObjectRef } from '../useObjectRef.js';
import { type FormChangeHandler, FormContext, type IChangeData, type IFormContext } from './FormContext.js';

interface IOptions {
  parent?: IFormContext;
  disableEnterSubmit?: boolean;
  onSubmit?: (event?: SubmitEvent | undefined) => Promise<void> | void;
  onChange?: FormChangeHandler;
}

export function useForm(options?: IOptions): IFormContext {
  let parentForm = useContext(FormContext);
  const [submittingExecutor] = useState(() => new Executor<SubmitEvent | undefined>());
  const [validationExecutor] = useState(() => new SyncExecutor());
  const [changeExecutor] = useState(() => new Executor<IChangeData>());

  if (options?.parent) {
    parentForm = options.parent;
  }

  const disableEnterSubmit = options?.disableEnterSubmit ?? parentForm?.disableEnterSubmit ?? false;

  useExecutor({
    executor: parentForm?.onChange,
    before: changeExecutor,
  });

  useExecutor({
    executor: changeExecutor,
    handlers: [({ value, name }) => options?.onChange?.(value, name)],
  });

  useExecutor({
    executor: parentForm?.onSubmit,
    before: submittingExecutor,
  });

  useExecutor({
    executor: submittingExecutor,
    handlers: [event => options?.onSubmit?.(event)],
  });

  const context = useObjectRef<IFormContext>(
    () => ({
      ref: null,
      onValidate: validationExecutor,
      onChange: changeExecutor,
      onSubmit: submittingExecutor,
      setRef(ref) {
        if (this.parent) {
          this.parent.setRef(ref);
        } else {
          if (this.ref) {
            this.ref.removeEventListener('submit', this.submit);
          }
          this.ref = ref;
          if (ref) {
            ref.addEventListener('submit', this.submit);
          }
        }
      },
      change(value, name) {
        if (this.parent) {
          this.parent.change(value, name);
        } else {
          this.onChange.execute({ value, name });
        }
      },
      keyDown(event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const isCtrlEnterSubmit =
          event.key === 'Enter' &&
          (event.ctrlKey || event.metaKey) &&
          this.disableEnterSubmit === false &&
          event.target instanceof HTMLTextAreaElement;
        const isEnterSubmit = event.key === 'Enter' && this.disableEnterSubmit === false && event.target instanceof HTMLInputElement;

        if (this.parent) {
          this.parent.keyDown(event);
        } else if (isCtrlEnterSubmit || isEnterSubmit) {
          event.preventDefault();
          if (this.ref) {
            this.ref?.requestSubmit();
          } else {
            this.submit();
          }
        }
      },
      async submit(event) {
        if (this.parent) {
          await this.parent.submit(event);
        } else {
          event?.preventDefault();

          if (this.validate()) {
            await this.onSubmit.execute(event);
          }
        }
      },
      reportValidity() {
        if (this.parent) {
          return this.parent.reportValidity();
        }
        return this.ref?.reportValidity() ?? false;
      },
      validate() {
        if (this.parent) {
          return this.parent.validate();
        } else {
          const validationContext = this.onValidate.execute();
          const interrupted = ExecutorInterrupter.isInterrupted(validationContext);

          if (interrupted) {
            context.ref?.reportValidity();
          }
          return interrupted === false;
        }
      },
    }),
    { parent: parentForm, disableEnterSubmit },
    ['setRef', 'change', 'keyDown', 'submit', 'validate'],
  );

  useExecutor({
    executor: parentForm?.onValidate,
    before: validationExecutor,
  });

  useExecutor({
    executor: validationExecutor,
    handlers: [
      function validateFormConstraints(_, executorContext) {
        if (!context.ref) {
          return;
        }

        if (context.ref.checkValidity() === false) {
          ExecutorInterrupter.interrupt(executorContext);
        }
      },
    ],
  });

  return context;
}
