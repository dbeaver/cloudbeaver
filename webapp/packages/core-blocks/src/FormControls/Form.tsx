/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React, { forwardRef, useState } from 'react';

import { useCombinedRef } from '../useCombinedRef';
import { useFocus } from '../useFocus';
import { FormChangeHandler, FormContext, IFormContext } from './FormContext';
import { useForm } from './useForm';

type FormDetailedProps = Omit<React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>, 'onChange' | 'onSubmit'> & {
  context?: IFormContext;
  disabled?: boolean;
  disableEnterSubmit?: boolean;
  focusFirstChild?: boolean;
  onSubmit?: (event?: SubmitEvent) => Promise<void> | void;
  onChange?: FormChangeHandler;
};

export const Form = forwardRef<HTMLFormElement, FormDetailedProps>(function Form(
  { context, disabled: disabledProp, disableEnterSubmit, focusFirstChild, children, onSubmit, onChange = () => {}, ...rest },
  ref,
) {
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild });
  let [disabled, setDisabled] = useState(false);

  disabled = disabled || disabledProp || false;

  const formContext = useForm({
    parent: context,
    onSubmit(event) {
      const result = onSubmit?.(event);

      if (result instanceof Promise) {
        setDisabled(true);
        result.finally(() => {
          setDisabled(false);
        });
      } else {
        setDisabled(false);
      }
    },
    disableEnterSubmit,
  });

  const setFormRef = useCombinedRef<HTMLFormElement>(formContext.setRef, focusedRef, ref);

  if (formContext.parent && formContext.parent !== context) {
    return (
      <fieldset disabled={disabled} className={rest.className}>
        <FormContext.Provider value={formContext}>{children}</FormContext.Provider>
      </fieldset>
    );
  }

  return (
    <form {...rest} ref={setFormRef}>
      <fieldset disabled={disabled} className={rest.className}>
        <FormContext.Provider value={formContext}>{children}</FormContext.Provider>
      </fieldset>
      <button type="submit" disabled={disableEnterSubmit} aria-hidden={disableEnterSubmit} hidden />
    </form>
  );
});
