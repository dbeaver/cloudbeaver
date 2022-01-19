/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import React, { forwardRef, useContext, useState } from 'react';

import { Executor } from '@cloudbeaver/core-executor';

import { useObjectRef } from '../useObjectRef';
import { FormContext, IChangeData, IFormContext } from './FormContext';

export interface IFormStateInfo {
  edited: boolean;
  disabled: boolean;
  readonly: boolean;
  statusMessage: string | null;
}

type FormDetailedProps = Omit<React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>, 'onChange' | 'onSubmit'> & {
  disabled?: boolean;
  disableEnterSubmit?: boolean;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => Promise<void> | void;
  onChange?: (value: string | number | boolean | null | undefined, name: string | undefined) => void;
};

export const SubmittingForm = forwardRef<HTMLFormElement, FormDetailedProps>(function SubmittingForm(
  {
    disabled: disabledProp,
    disableEnterSubmit,
    children,
    onSubmit,
    onChange = () => {},
    ...rest
  },
  ref
) {
  let [disabled, setDisabled] = useState(false);

  disabled = disabled || disabledProp || false;

  const props = useObjectRef(() => ({
    handleSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();

      setDisabled(true);
      const result = this.onSubmit?.(e);

      if (result instanceof Promise) {
        result.finally(() => { setDisabled(false); });
      } else {
        setDisabled(false);
      }
    },
  }), {
    parentContext: useContext(FormContext),
    onChange,
    onSubmit,
  }, ['handleSubmit']);

  const context = useObjectRef<IFormContext>(() => ({
    changeExecutor: new Executor<IChangeData>(),
    change(value, name) {
      props.onChange(value, name);
      props.parentContext?.change(value, name);
      this.changeExecutor.execute({ value, name });
    },
  }), false, ['change']);

  return (
    <form {...rest} ref={ref} onSubmit={e => props.handleSubmit(e)}>
      <fieldset disabled={disabled} className={rest.className}>
        <FormContext.Provider value={context}>
          {children}
        </FormContext.Provider>
      </fieldset>
      <button type="submit" disabled={disableEnterSubmit} aria-hidden={disableEnterSubmit} hidden />
    </form>
  );
});
