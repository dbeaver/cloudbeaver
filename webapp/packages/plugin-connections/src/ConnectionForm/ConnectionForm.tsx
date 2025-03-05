/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ExceptionMessage, Form, Loader, Placeholder, s, StatusMessage, useExecutor, useForm, useObjectRef, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';
import { formStatusContext, formValidationContext, TabList, TabPanelList, TabsState } from '@cloudbeaver/core-ui';

import { ConnectionFormActionsContext, type IConnectionFormActionsContext } from './ConnectFormActionsContext.js';
import style from './ConnectionForm.module.css';
import { connectionConfigContext } from './Contexts/connectionConfigContext.js';
import type { ConnectionFormStateRefactored } from './ConnectionFormStateRefactored.js';
import { getFirstException } from '@cloudbeaver/core-utils';
import { ConnectionFormServiceRefactored } from './ConnectionFormServiceRefactored.js';
import { ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';

export interface ConnectionFormProps {
  formState: ConnectionFormStateRefactored;
  onCancel?: () => void;
  onSave?: (config: ConnectionConfig) => void;
  className?: string;
}

export const ConnectionForm = observer<ConnectionFormProps>(function ConnectionForm({ formState, onCancel, onSave = () => {}, className }) {
  const props = useObjectRef({ onSave });
  const service = useService(ConnectionFormServiceRefactored);
  const styles = useS(style);
  const notificationService = useService(NotificationService);
  const connectionInfoResource = useService(ConnectionInfoResource);

  const form = useForm({
    onSubmit: async event => {
      if (event?.type === 'test') {
        formState.setState({
          ...formState.state,
          submitType: 'test',
        });
      } else {
        formState.setState({
          ...formState.state,
          submitType: 'submit',
        });
      }

      const initialMode = formState.mode;
      const saved = await formState.save();
      const info = connectionInfoResource.get(createConnectionParam(formState.state.projectId, formState.state.config.connectionId!));

      if (saved) {
        if (formState.state.submitType === 'submit') {
          if (initialMode === 'create') {
            notificationService.notify(
              {
                title: 'connections_connection_create_success',
                message: info?.name,
              },
              ENotificationType.Success,
            );
          } else {
            notificationService.notify(
              {
                title: 'connections_connection_update_success',
                message: info?.name,
              },
              ENotificationType.Success,
            );
          }
        }

        if (formState.state.submitType === 'test') {
          // const message = [
          //   ['Connection is established', ''],
          //   ['Client version', info?.clientVersion],
          //   ['Server version', info?.serverVersion],
          //   ['Connection time', info?.connectTime],
          // ];
          // notificationService.notify(
          //   {
          //     title: 'Connection is established',
          //     message:
          //       'Client version: ' + info?.clientVersion + '\nServer version: ' + info?.serverVersion + '\nConnection time: ' + info?.connectTime,
          //   },
          //   ENotificationType.Info,
          // );
        }
      } else {
        if (formState.state.submitType === 'submit') {
          notificationService.notify(
            {
              title: 'connections_connection_create_fail',
            },
            ENotificationType.Error,
          );
        } else {
          notificationService.notify(
            {
              title: 'connections_connection_test_fail',
            },
            ENotificationType.Error,
          );
        }
      }
    },
  });

  const actionsContext = useObjectRef<IConnectionFormActionsContext>(() => ({
    save: async () => form.submit(new SubmitEvent('submit')),
    test: async () => form.submit(new SubmitEvent('test')),
    onCancel,
  }));

  useExecutor({
    executor: formState.submitTask,
    postHandlers: [
      function save(data, contexts) {
        const validation = contexts.getContext(formValidationContext);
        const state = contexts.getContext(formStatusContext);
        const config = contexts.getContext(connectionConfigContext);

        if (validation.valid && state.saved && data.state.submitType === 'submit') {
          props.onSave(config);
        }
      },
    ],
  });

  if (getFirstException(formState.exception)) {
    return <ExceptionMessage exception={getFirstException(formState.exception)} />;
  }

  return (
    <Form context={form} contents>
      <TabsState container={service.parts} localState={formState.parts} formState={formState}>
        <div className={s(styles, { box: true }, className)}>
          <div className={s(styles, { connectionTopBar: true })}>
            <div className={s(styles, { connectionTopBarTabs: true })}>
              <div className={s(styles, { connectionStatusMessage: true })}>
                <StatusMessage type={ENotificationType.Info} message={formState.statusMessage} />
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
