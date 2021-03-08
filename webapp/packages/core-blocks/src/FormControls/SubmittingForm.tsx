/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, forwardRef, useMemo } from 'react';

import { FormContext } from './FormContext';

type FormDetailedProps = Omit<React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>, 'onChange'> & {
  disabled?: boolean;
  onChange?: (value: string | number | boolean | null | undefined, name: string | undefined) => void;
};

export const SubmittingForm = forwardRef<HTMLFormElement, FormDetailedProps>(function SubmittingForm(
  {
    disabled,
    children,
    onSubmit,
    onChange = () => {},
    ...rest
  },
  ref
) {
  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  }, [onSubmit]);

  const context = useMemo(() => ({ onChange }), [onChange]);

  return (
    <form {...rest} ref={ref} onSubmit={handleSubmit}>
      <fieldset disabled={disabled} className={rest.className}>
        <FormContext.Provider value={context}>
          {children}
        </FormContext.Provider>
      </fieldset>
      <button type="submit" hidden />
    </form>
  );
});
