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
}

export const ConnectionPreferencesForm = observer<ConnectionPreferencesFormProps>(function ConnectionPreferencesForm({ formState, onCancel }) {
  const connectionPreferencesFormService = useService(ConnectionPreferencesFormService);
  const notificationService = useService(NotificationService);

  const infoPart = getConnectionPreferencesFormInfoPart(formState);
  const exception = getFirstException(formState.exception);

  const form = useForm({
    onSubmit: async () => {
      const context = new ExecutionContext<IFormState<IConnectionPreferencesFormState>>(formState);

      const saved = await formState.save(context);

      if (saved) {
        notificationService.logSuccess(
          {
            title: 'core_connections_connection_update_success',
            message: infoPart.state.name,
          },
        );
      }
    },
  });

  const actionsContext = useObjectRef<IConnectionPreferencesFormActionsContext>(() => ({
    save: () => form.submit(new SubmitEvent('submit')),
    onCancel,
  }));

  return (
    <Form context={form} contents>
      <TabsState container={connectionPreferencesFormService.parts} localState={formState.parts} formState={formState}>
        <div className="tw:flex tw:flex-col tw:flex-1 tw:h-full tw:overflow-auto theme-background-secondary theme-text-on-secondary">
          <div className="tw:relative tw:flex tw:pt-4 tw:border-b-2 theme-border-color-background theme-background-secondary theme-text-on-secondary">
            <div className="tw:flex-1 tw:overflow-hidden">
              <div className="tw:h-6 tw:px-4 tw:flex tw:items-center tw:gap-2 theme-typography--caption tw:overflow-hidden">
                <StatusMessage
                  type={exception ? ENotificationType.Error : ENotificationType.Info}
                  message={formState.statusMessage}
                  exception={exception}
                />
              </div>
              <TabList className="tw:relative tw:flex-shrink-0 tw:items-center" disabled={formState.isDisabled} underline big />
            </div>
            <div className="tw:flex tw:items-center tw:px-6 tw:gap-4">
              <Loader suspense inline hideMessage hideException>
                <ConnectionPreferencesFormActionsContext.Provider value={actionsContext}>
                  <Placeholder container={connectionPreferencesFormService.actionsContainer} formState={formState} />
                </ConnectionPreferencesFormActionsContext.Provider>
              </Loader>
            </div>
          </div>
          <div className="tw:relative tw:flex tw:flex-1 tw:flex-col tw:overflow-auto theme-background-secondary theme-border-color-background">
            <TabPanelList />
          </div>
        </div>
      </TabsState>
    </Form>
  );
});
