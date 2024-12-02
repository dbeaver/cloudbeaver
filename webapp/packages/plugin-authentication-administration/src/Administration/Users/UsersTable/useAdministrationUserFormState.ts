/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useRef } from 'react';

import { IServiceProvider, useService } from '@cloudbeaver/core-di';

import { AdministrationUserFormService } from '../UserForm/AdministrationUserFormService.js';
import { AdministrationUserFormState } from '../UserForm/AdministrationUserFormState.js';

export function useAdministrationUserFormState(id: string | null, configure?: (state: AdministrationUserFormState) => any) {
  const service = useService(AdministrationUserFormService);
  const serviceProvider = useService(IServiceProvider);
  const ref = useRef<null | AdministrationUserFormState>(null);

  if (ref.current?.id !== id) {
    ref.current = new AdministrationUserFormState(serviceProvider, service, {
      userId: id,
    });
    configure?.(ref.current);
  }

  return ref.current;
}
