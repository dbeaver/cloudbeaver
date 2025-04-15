/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, Form, Loader, Placeholder, s, StatusMessage, useForm, useObjectRef, useResource, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';
import { formSubmitContext, TabList, TabPanelList, TabsState, type IFormState } from '@cloudbeaver/core-ui';

import { ConnectionFormActionsContext, type IConnectionFormActionsContext } from './ConnectFormActionsContext.js';
import style from './ConnectionForm.module.css';
import type { ConnectionFormState } from './ConnectionFormState.js';
import { getFirstException } from '@cloudbeaver/core-utils';
import { ConnectionFormService } from './ConnectionFormService.js';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { getConnectionFormOptionsPart } from './Options/getConnectionFormOptionsPart.js';
import { ExecutionContext } from '@cloudbeaver/core-executor';
import type { IConnectionFormState } from './IConnectionFormState.js';

export interface ConnectionFormProps {
  formState: ConnectionFormState;
  onCancel?: () => void;
  onSave?: (config: ConnectionConfig) => void;
  className?: string;
}

export const ConnectionForm = observer<ConnectionFormProps>(function ConnectionForm({ formState, onCancel, onSave = () => {}, className }) {
  const service = useService(ConnectionFormService);
  const styles = useS(style);
  const notificationService = useService(NotificationService);
  const optionsPart = getConnectionFormOptionsPart(formState);
  const connectionInfoResource = useResource(ConnectionForm, ConnectionInfoResource, optionsPart.connectionKey, {
    active: !!optionsPart.connectionKey,
  });
  const exception = getFirstException(formState.exception);

  const form = useForm({
    onSubmit: async event => {
      const submitType = event?.type === 'test' ? 'test' : 'submit';
      const context = new ExecutionContext<IFormState<IConnectionFormState>>(formState);

      const submitInfo = context.getContext(formSubmitContext);
      submitInfo.setType(submitType);
      if (submitType === 'test') {
        submitInfo.setSubmitOnNoChanges(true);
      }
      const initialMode = formState.mode;
      const saved = await formState.save(context);

      if (saved) {
        if (submitType === 'submit') {
          notificationService.notify(
            {
              title: initialMode === 'create' ? 'core_connections_connection_create_success' : 'core_connections_connection_update_success',
              message: connectionInfoResource.data?.name,
            },
            ENotificationType.Success,
          );

          onSave(optionsPart.state);
        }
      } else {
        const error = getFirstException(formState.exception);

        if (submitType === 'submit') {
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

  return (
    <Form context={form} contents>
      <TabsState container={service.parts} localState={formState.parts} formState={formState}>
        <div className={s(styles, { box: true }, className)}>
          <div className={s(styles, { connectionTopBar: true })}>
            <Container className={s(styles, { connectionTopBarTabs: true })} overflow>
              <Container className={s(styles, { connectionStatusMessage: true })} overflow>
                <StatusMessage
                  type={exception ? ENotificationType.Error : ENotificationType.Info}
                  message={formState.statusMessage}
                  exception={exception}
                />
              </Container>
              <TabList className={s(styles, { tabList: true })} disabled={formState.isDisabled} underline big />
            </Container>
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
