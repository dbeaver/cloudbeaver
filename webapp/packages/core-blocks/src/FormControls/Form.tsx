/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React, { forwardRef, useState } from 'react';

import { s } from '../s';
import { useCombinedRef } from '../useCombinedRef';
import { useFocus } from '../useFocus';
import { useS } from '../useS';
import styles from './Form.m.css';
import { FormChangeHandler, FormContext, IFormContext } from './FormContext';
import { useForm } from './useForm';

type FormDetailedProps = Omit<React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>, 'onChange' | 'onSubmit'> & {
  context?: IFormContext;
  disabled?: boolean;
  disableEnterSubmit?: boolean;
  focusFirstChild?: boolean;
  contents?: boolean;
  onSubmit?: (event?: SubmitEvent) => Promise<void> | void;
  onChange?: FormChangeHandler;
};

export const Form = forwardRef<HTMLFormElement, FormDetailedProps>(function Form(
  { context, disabled: disabledProp, disableEnterSubmit, focusFirstChild, children, contents, style, onSubmit, onChange, ...rest },
  ref,
) {
  const st = useS(styles);
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild });
  const [disabledLocal, setDisabledLocal] = useState(false);

  const disabled = disabledLocal || disabledProp || false;

  const formContext = useForm({
    disableEnterSubmit,
    parent: context,
    async onSubmit(event) {
      try {
        setDisabledLocal(true);
        await onSubmit?.(event);
      } finally {
        setDisabledLocal(false);
      }
    },
    onChange,
  });

  const setFormRef = useCombinedRef<HTMLFormElement>(formContext.setRef, focusedRef, ref);

  if (formContext.parent && formContext.parent !== context) {
    return (
      <fieldset disabled={disabled} className={s(st, { contents }, rest.className)} style={style}>
        <FormContext.Provider value={formContext}>{children}</FormContext.Provider>
      </fieldset>
    );
  }

  return (
    <form style={style} {...rest} ref={setFormRef} className={s(st, { contents }, rest.className)}>
      <fieldset disabled={disabled} className={s(st, { contents }, rest.className)} style={style}>
        <FormContext.Provider value={formContext}>{children}</FormContext.Provider>
      </fieldset>
      <button type="submit" disabled={disableEnterSubmit} aria-hidden={disableEnterSubmit} hidden />
    </form>
  );
});
