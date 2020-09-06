/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, forwardRef, useMemo } from 'react';

import { FormContext } from './FormContext';

type FormDetailedProps = Omit<React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>, 'onChange'> & {
  onChange?(value: string | number | boolean, name: string | undefined): void;
}

export const SubmittingForm = forwardRef<HTMLFormElement, FormDetailedProps>(function SubmittingForm(
  {
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
    <form {...rest} onSubmit={handleSubmit} ref={ref}>
      <FormContext.Provider value={context}>
        {children}
      </FormContext.Provider>
      <button type="submit" hidden />
    </form>
  );
});
