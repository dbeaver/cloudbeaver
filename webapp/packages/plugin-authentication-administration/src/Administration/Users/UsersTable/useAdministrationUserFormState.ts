/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { useEffect } from 'react';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import { IServiceProvider, useService } from '@cloudbeaver/core-di';

import { AdministrationUserFormService } from '../UserForm/AdministrationUserFormService';
import { AdministrationUserFormState } from '../UserForm/AdministrationUserFormState';

export function useAdministrationUserFormState(id: string | null, configure?: (state: AdministrationUserFormState) => any) {
  const service = useService(AdministrationUserFormService);
  const serviceProvider = useService(IServiceProvider);
  const ref = useObservableRef(
    () => ({ formState: createFormState(id) }),
    {
      formState: observable.ref,
    },
    false,
  );

  function createFormState(id: string | null) {
    const formState = new AdministrationUserFormState(serviceProvider, service, {
      userId: id,
    });
    configure?.(formState);

    return formState;
  }

  useEffect(() => {
    if (ref.formState.id !== id) {
      const formState = createFormState(id);
      ref.formState = formState;
    }
  }, [id]);

  return ref.formState;
}
