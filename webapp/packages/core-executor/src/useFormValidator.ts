
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useRef } from 'react';

import type { IExecutor } from './IExecutor';
import type { IExecutorHandlersCollection } from './IExecutorHandlersCollection';

export function useFormValidator(
  validationTask: IExecutor<any> | IExecutorHandlersCollection<any>,
  ref: React.RefObject<HTMLFormElement>,
  callback?: () => void
): void {
  const callbackRef = useRef({
    callback,
    ref,
  });
  callbackRef.current.callback = callback;
  callbackRef.current.ref = ref;

  useEffect(() => {
    if (!validationTask) {
      return;
    }

    function validate() {
      if (callbackRef.current) {
        callbackRef.current.ref.current?.checkValidity();
        callbackRef.current.ref.current?.reportValidity();

        callbackRef.current.callback?.();
      }
    }
    validationTask.addHandler(validate);

    return () => validationTask.removeHandler(validate);
  }, [validationTask]);
}
