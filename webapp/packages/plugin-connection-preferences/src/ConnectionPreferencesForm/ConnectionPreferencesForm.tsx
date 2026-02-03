/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Form, Loader, Placeholder, StatusMessage, useForm, useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';
import { ExecutionContext } from '@cloudbeaver/core-executor';
import { TabList, TabPanelList, TabsState, type IFormState } from '@cloudbeaver/core-ui';
import { getFirstException } from '@cloudbeaver/core-utils';

import { ConnectionPreferencesFormService } from './ConnectionPreferencesFormService.js';
import type { ConnectionPreferencesFormState } from './ConnectionPreferencesFormState.js';
import type { IConnectionPreferencesFormState } from './IConnectionPreferencesFormState.js';
import { ConnectionPreferencesFormActionsContext, type IConnectionPreferencesFormActionsContext } from './ConnectionPreferencesFormActionsContext.js';
import { getConnectionPreferencesFormInfoPart } from './ConnectionPreferencesFormInfo/getConnectionPreferencesFormInfoPart.js';

export interface ConnectionPreferencesFormProps {
  formState: ConnectionPreferencesFormState;
  onCancel?: () => void;
  onSave?: (config: ConnectionConfig) => void;
}

export const ConnectionPreferencesForm = observer<ConnectionPreferencesFormProps>(function ConnectionPreferencesForm({ formState, onCancel, onSave = () => { } }) {
  const connectionPreferencesFormServicee = useService(ConnectionPreferencesFormService);
  const notificationService = useService(NotificationService);

  const infoPart = getConnectionPreferencesFormInfoPart(formState);
  const exception = getFirstException(formState.exception);

  const form = useForm({
    onSubmit: async event => {
      const context = new ExecutionContext<IFormState<IConnectionPreferencesFormState>>(formState);

      const saved = await formState.save(context);

      if (saved) {
        notificationService.notify(
          {
            title: 'core_connections_connection_update_success',
            message: infoPart.state.name,
          },
          ENotificationType.Success,
        );

        onSave(infoPart.state);
      }
    },
  });

  const actionsContext = useObjectRef<IConnectionPreferencesFormActionsContext>(() => ({
    save: () => form.submit(new SubmitEvent('submit')),
    onCancel,
  }));

  return (
    <Form context={form} contents>
      <TabsState container={connectionPreferencesFormServicee.parts} localState={formState.parts} formState={formState}>
        <StatusMessage
          type={exception ? ENotificationType.Error : ENotificationType.Info}
          message={formState.statusMessage}
          exception={exception}
        />
        <TabList disabled={formState.isDisabled} underline big />
        <div>
          <Loader suspense inline hideMessage hideException>
            <ConnectionPreferencesFormActionsContext.Provider value={actionsContext}>
              <Placeholder container={connectionPreferencesFormServicee.actionsContainer} formState={formState} />
            </ConnectionPreferencesFormActionsContext.Provider>
          </Loader>
          <div>
            <TabPanelList />
          </div>
        </div>
      </TabsState>
    </Form>
  );
});
