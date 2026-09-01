/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  Container,
  Form,
  Loader,
  Placeholder,
  s,
  SContext,
  StatusMessage,
  type StyleRegistry,
  useForm,
  useObjectRef,
  useS,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';
import {
  FormMode,
  formSubmitContext,
  TabList,
  TabListStyles,
  TabPanelList,
  TabsState,
  TabStyles,
  TabTitleStyles,
  type IFormState,
} from '@cloudbeaver/core-ui';

import { ConnectionFormActionsContext, type IConnectionFormActionsContext } from './ConnectFormActionsContext.js';
import style from './ConnectionForm.module.css';
import { ConnectionName } from './ConnectionName.js';
import type { ConnectionFormState } from './ConnectionFormState.js';
import { getFirstException } from '@cloudbeaver/core-utils';
import { ConnectionFormService } from './ConnectionFormService.js';
import { getConnectionFormOptionsPart } from './Options/getConnectionFormOptionsPart.js';
import { ExecutionContext } from '@cloudbeaver/core-executor';
import type { IConnectionFormState } from './IConnectionFormState.js';

export interface IConnectionFormComponentProps {
  formState: ConnectionFormState;
  onCancel?: () => void;
  onSave?: (config: ConnectionConfig, isCreate?: boolean) => void;
  className?: string;
}

const tabsRegistry: StyleRegistry = [
  [TabStyles, { mode: 'append', styles: [style] }],
  [TabListStyles, { mode: 'append', styles: [style] }],
  [TabTitleStyles, { mode: 'append', styles: [style] }],
];

export const ConnectionForm = observer<IConnectionFormComponentProps>(function ConnectionForm({ formState, onCancel, onSave = () => {}, className }) {
  const service = useService(ConnectionFormService);
  const styles = useS(style);
  const notificationService = useService(NotificationService);
  const optionsPart = getConnectionFormOptionsPart(formState);
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
      const isCreate = formState.mode === FormMode.Create;
      const saved = await formState.save(context);

      if (saved) {
        if (submitType === 'submit') {
          notificationService.notify(
            {
              title: isCreate ? 'core_connections_connection_create_success' : 'core_connections_connection_update_success',
              message: optionsPart.state?.name,
            },
            ENotificationType.Success,
          );

          onSave(optionsPart.state, isCreate);
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
      <TabsState container={service.parts} localState={formState.parts} orientation="vertical" formState={formState}>
        <div className={s(styles, { box: true }, className)}>
          <div className={s(styles, { connectionTopBar: true })}>
            <Container className={s(styles, { connectionTopBarStatus: true })} overflow>
              <Container className={s(styles, { connectionStatusMessage: true })} overflow>
                <StatusMessage
                  type={exception ? ENotificationType.Error : ENotificationType.Info}
                  message={formState.statusMessage}
                  exception={exception}
                />
              </Container>
            </Container>
            <div className={s(styles, { connectionTopBarContent: true })}>
              {optionsPart.state.name && <ConnectionName driverId={optionsPart.state.driverId} name={optionsPart.state.name} />}
              <div className={s(styles, { connectionTopBarActions: true })}>
                <Loader suspense inline hideMessage hideException>
                  <ConnectionFormActionsContext.Provider value={actionsContext}>
                    <Placeholder container={service.actionsContainer} formState={formState} />
                  </ConnectionFormActionsContext.Provider>
                </Loader>
              </div>
            </div>
          </div>
          <div className={s(styles, { connectionBody: true })}>
            <SContext registry={tabsRegistry}>
              <TabList className={s(styles, { tabList: true })} disabled={formState.isDisabled} vertical />
            </SContext>
            <div className={s(styles, { contentBox: true })}>
              <TabPanelList />
            </div>
          </div>
        </div>
      </TabsState>
    </Form>
  );
});
