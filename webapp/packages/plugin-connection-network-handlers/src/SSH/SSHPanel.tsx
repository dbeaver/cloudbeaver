/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { useAutoLoad } from '@cloudbeaver/core-blocks';

import { SSH } from './SSH.js';
import { getConnectionFormSSHPart } from './getConnectionFormSSHPart.js';
import type { IConnectionFormProps } from '@cloudbeaver/plugin-connections';

export const SSHPanel: TabContainerPanelComponent<IConnectionFormProps> = observer(function SSHPanel(props) {
  const sshPart = getConnectionFormSSHPart(props.formState);

  useAutoLoad(SSHPanel, sshPart);

  if (!sshPart.state) {
    return null;
  }

  return <SSH {...props} handlerState={sshPart.state} />;
});
