/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { Button, ColoredContainer, Form, Group, GroupItem, s, useAutoLoad, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { NetworkHandlerAuthType, type NetworkHandlerConfigInput } from '@cloudbeaver/core-sdk';
import { NetworkHandlerResource } from '@cloudbeaver/core-network-handlers';
import { useService } from '@cloudbeaver/core-di';
import { useTab, type IFormState, type TabContainerPanelComponent } from '@cloudbeaver/core-ui';

import styles from './SSH.module.css';
import { getConnectionFormSSHPart } from './getConnectionFormSSHPart.js';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';
import { SSHForm } from '@cloudbeaver/plugin-connection-network-handlers';
import type { IConnectionFormState } from '../IConnectionFormState.js';

interface Props {
  handlerState: NetworkHandlerConfigInput;
  formState: IFormState<IConnectionFormState>;
}

export const SSH: TabContainerPanelComponent<Props> = observer(function SSH({ formState, handlerState, tabId }) {
  const { selected } = useTab(tabId);
  const [loading, setLoading] = useState(false);
  const networkHandlerResource = useService(NetworkHandlerResource);

  const sshPart = getConnectionFormSSHPart(formState);
  const optionsPart = getConnectionFormOptionsPart(formState);

  async function testConnection() {
    setLoading(true);
    const config = sshPart.getConfig();
    try {
      await networkHandlerResource.test(config, formState.state.projectId, formState.state.connectionId);
    } finally {
      setLoading(false);
    }
  }

  const style = useS(styles);
  const translate = useTranslate();
  const disabled = formState.isDisabled || loading || formState.isReadOnly;
  const enabled = handlerState.enabled || false;
  const keyAuth = handlerState.authType === NetworkHandlerAuthType.PublicKey;
  const passwordFilled = (sshPart.initialState?.password === null && handlerState.password !== '') || !!handlerState.password?.length;
  const testAvailable = keyAuth ? !!handlerState.key?.length : passwordFilled;

  useAutoLoad(SSH, [sshPart, optionsPart], selected);

  return (
    <Form className={s(style, { form: true })}>
      <ColoredContainer parent>
        <Group form gap keepSize large>
          <SSHForm
            state={handlerState}
            initialState={sshPart.initialState}
            disabled={disabled}
            readonly={formState.isReadOnly}
            sharedCredentials={optionsPart.state.sharedCredentials}
            projectId={formState.state.projectId}
          />
          <GroupItem>
            <Button type="button" disabled={disabled || !enabled || !testAvailable} loader onClick={testConnection}>
              {translate('connections_network_handler_test')}
            </Button>
          </GroupItem>
        </Group>
      </ColoredContainer>
    </Form>
  );
});
