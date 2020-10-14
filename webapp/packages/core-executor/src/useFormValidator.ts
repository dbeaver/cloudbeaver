
/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useEffect, useRef } from 'react';

import { IExecutor } from './IExecutor';

export function useFormValidator(
  validationTask: IExecutor<boolean>,
  ref: React.RefObject<HTMLFormElement>,
  callback?: () => void
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const validate = useCallback(() => {
    ref.current?.checkValidity();
    ref.current?.reportValidity();

    if (callbackRef.current) {
      callbackRef.current();
    }
  }, [ref]);

  useEffect(() => {
    if (!validationTask) {
      return;
    }
    validationTask.addHandler(validate);

    return () => validationTask.removeHandler(validate);
  }, [validationTask, validate]);
}
