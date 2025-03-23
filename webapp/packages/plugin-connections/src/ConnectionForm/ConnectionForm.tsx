/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Form, Loader, Placeholder, s, StatusMessage, useExecutor, useForm, useObjectRef, useResource, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';
import { formStatusContext, formValidationContext, TabList, TabPanelList, TabsState } from '@cloudbeaver/core-ui';

import { ConnectionFormActionsContext, type IConnectionFormActionsContext } from './ConnectFormActionsContext.js';
import style from './ConnectionForm.module.css';
import type { ConnectionFormState } from './ConnectionFormState.js';
import { getFirstException } from '@cloudbeaver/core-utils';
import { ConnectionFormService } from './ConnectionFormService.js';
import { ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { getConnectionFormOptionsPart } from './Options/getConnectionFormOptionsPart.js';

export interface ConnectionFormProps {
  formState: ConnectionFormState;
  onCancel?: () => void;
  onSave?: (config: ConnectionConfig) => void;
  className?: string;
}

export const ConnectionForm = observer<ConnectionFormProps>(function ConnectionForm({ formState, onCancel, onSave = () => {}, className }) {
  const props = useObjectRef({ onSave });
  const service = useService(ConnectionFormService);
  const styles = useS(style);
  const notificationService = useService(NotificationService);
  const optionsPart = getConnectionFormOptionsPart(formState);
  const connectionInfoResource = useResource(
    ConnectionForm,
    ConnectionInfoResource,
    createConnectionParam(formState.state.projectId, optionsPart.state.connectionId!),
    {
      active: !!formState.state.projectId && !!optionsPart.state.connectionId,
    },
  );
  const exception = getFirstException(formState.exception);

  const form = useForm({
    onSubmit: async event => {
      formState.state.submitType = event?.type === 'test' ? 'test' : 'submit';

      const initialMode = formState.mode;
      const saved = await formState.save();

      if (saved) {
        if (formState.state.submitType === 'submit') {
          notificationService.notify(
            {
              title: initialMode === 'create' ? 'core_connections_connection_create_success' : 'core_connections_connection_update_success',
              message: connectionInfoResource.data?.name,
            },
            ENotificationType.Success,
          );
        }
      } else {
        const error = getFirstException(formState.exception);

        if (formState.state.submitType === 'submit') {
          notificationService.logException(error, 'connections_connection_create_fail');
        }
      }
    },
  });

  const actionsContext = useObjectRef<IConnectionFormActionsContext>(() => ({
    save: () => form.submit(new SubmitEvent('submit')),
    test: () => form.submit(new SubmitEvent('test')),
    onCancel,
  }));

  useExecutor({
    executor: formState.submitTask,
    postHandlers: [
      function save(data, contexts) {
        const validation = contexts.getContext(formValidationContext);
        const state = contexts.getContext(formStatusContext);

        if (validation.valid && state.saved && data.state.submitType === 'submit') {
          props.onSave(optionsPart.state);
        }
      },
    ],
  });

  return (
    <Form context={form} contents>
      <TabsState container={service.parts} localState={formState.parts} formState={formState}>
        <div className={s(styles, { box: true }, className)}>
          <div className={s(styles, { connectionTopBar: true })}>
            <div className={s(styles, { connectionTopBarTabs: true })}>
              <div className={s(styles, { connectionStatusMessage: true })}>
                <StatusMessage
                  type={exception ? ENotificationType.Error : ENotificationType.Info}
                  message={formState.statusMessage}
                  exception={exception}
                  multipleRows
                />
              </div>
              <TabList className={s(styles, { tabList: true })} disabled={formState.isDisabled} underline big />
            </div>
            <div className={s(styles, { connectionTopBarActions: true })}>
              <Loader suspense inline hideMessage hideException>
                <ConnectionFormActionsContext.Provider value={actionsContext}>
                  <Placeholder container={service.actionsContainer} formState={formState} />
                </ConnectionFormActionsContext.Provider>
              </Loader>
            </div>
          </div>
          <div className={s(styles, { contentBox: true })}>
            <TabPanelList />
          </div>
        </div>
      </TabsState>
    </Form>
  );
});
