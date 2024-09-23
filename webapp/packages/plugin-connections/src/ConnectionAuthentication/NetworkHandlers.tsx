/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Group } from '@cloudbeaver/core-blocks';
import type { NetworkHandlerConfigInput } from '@cloudbeaver/core-sdk';

import { NetworkHandlerAuthForm } from './NetworkHandlerAuthForm.js';

interface Props {
  networkHandlers: string[];
  networkHandlersConfig: NetworkHandlerConfigInput[];
  disabled?: boolean;
  allowSaveCredentials?: boolean;
  projectId: string | null;
}

export const NetworkHandlers = observer<Props>(function NetworkHandlers({
  networkHandlers,
  networkHandlersConfig,
  allowSaveCredentials,
  disabled,
  projectId,
}) {
  if (!networkHandlers.length) {
    return null;
  }

  return (
    <Group gap small>
      {networkHandlers.map(handler => (
        <NetworkHandlerAuthForm
          key={handler}
          projectId={projectId}
          id={handler}
          networkHandlersConfig={networkHandlersConfig}
          allowSaveCredentials={allowSaveCredentials}
          disabled={disabled}
        />
      ))}
    </Group>
  );
});
