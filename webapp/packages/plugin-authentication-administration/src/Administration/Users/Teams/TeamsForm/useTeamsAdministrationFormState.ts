/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useRef } from 'react';

import { IServiceProvider, useService } from '@cloudbeaver/core-di';

import { TeamsAdministrationFormService } from './TeamsAdministrationFormService.js';
import { TeamsAdministrationFormState } from './TeamsAdministrationFormState.js';

export function useTeamsAdministrationFormState(id: string | null, configure?: (state: TeamsAdministrationFormState) => any) {
  const service = useService(TeamsAdministrationFormService);
  const serviceProvider = useService(IServiceProvider);
  const ref = useRef<null | TeamsAdministrationFormState>(null);

  if (ref.current?.state.teamId !== id) {
    ref.current = new TeamsAdministrationFormState(serviceProvider, service, {
      teamId: id,
    });
    configure?.(ref.current);
  }

  return ref.current;
}
