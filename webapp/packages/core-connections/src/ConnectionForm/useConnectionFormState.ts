/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { useState } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ExecutorHandlersCollection } from '@cloudbeaver/core-executor';

import { isLocalConnection } from '../Administration/ConnectionsResource';
import { IConnectionForm, IConnectionFormData, IConnectionFormOptions, IConnectionFormState, IConnectionFormSubmitData, ConnectionFormService } from './ConnectionFormService';

export function useConnectionFormState(
  data: IConnectionFormData,
  options: IConnectionFormOptions,
  defaultState?: IConnectionForm
): IConnectionFormState {
  const props = useObjectRef({ data, options });
  const service = useService(ConnectionFormService);
  const [submittingHandlers] = useState(() => new ExecutorHandlersCollection<IConnectionFormSubmitData>());
  const [form] = useState<IConnectionForm>(() => observable({
    disabled: false,
    loading: false,
    get originLocal() {
      return !props.data.info || isLocalConnection(props.data.info);
    },
    ...defaultState,
  }));

  return useObjectRef({
    form,
    submittingHandlers,
    async save() {
      await service.formSubmittingTask.executeScope(
        {
          ...props,
          form,
          submitType: 'submit',
        },
        submittingHandlers
      );
    },
    async test() {
      await service.formSubmittingTask.executeScope(
        {
          ...props,
          form,
          submitType: 'test',
        },
        submittingHandlers
      );
    },
  });
}
