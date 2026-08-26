/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ColoredContainer, Form, Group, s, useAutoLoad, useS } from '@cloudbeaver/core-blocks';
import { type NetworkHandlerConfigInput } from '@cloudbeaver/core-sdk';
import { SSHForm } from '@cloudbeaver/plugin-network-handlers';
import { useTab, type IFormState, type TabContainerPanelComponent } from '@cloudbeaver/core-ui';

import styles from './SSH.module.css';
import { getConnectionFormSSHPart } from './getConnectionFormSSHPart.js';
import { getConnectionFormOptionsPart, type IConnectionFormState } from '@cloudbeaver/plugin-connections';

interface Props {
  handlerState: NetworkHandlerConfigInput;
  formState: IFormState<IConnectionFormState>;
}

export const SSH: TabContainerPanelComponent<Props> = observer(function SSH({ formState, handlerState, tabId }) {
  const { selected } = useTab(tabId);
  const sshPart = getConnectionFormSSHPart(formState);
  const optionsPart = getConnectionFormOptionsPart(formState);
  const style = useS(styles);

  useAutoLoad(SSH, [sshPart, optionsPart], selected);

  return (
    <Form className={s(style, { form: true })}>
      <ColoredContainer parent>
        <Group form gap keepSize large>
          <SSHForm
            state={handlerState}
            initialState={sshPart.initialState}
            disabled={formState.isDisabled || formState.isReadOnly}
            readonly={formState.isReadOnly || sshPart.isReadOnly}
            sharedCredentials={optionsPart.state.sharedCredentials}
            projectId={formState.state.projectId}
            connectionId={formState.state.connectionId}
          />
        </Group>
      </ColoredContainer>
    </Form>
  );
});
