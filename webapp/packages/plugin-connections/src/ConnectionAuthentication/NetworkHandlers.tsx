
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { BASE_CONTAINERS_STYLES, Group } from '@cloudbeaver/core-blocks';
import type { NetworkHandlerConfigInput } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { NetworkHandlerAuthForm } from './NetworkHandlerAuthForm';

interface Props {
  networkHandlers: string[];
  networkHandlersConfig: NetworkHandlerConfigInput[];
  disabled?: boolean;
  allowSaveCredentials?: boolean;
}

export const NetworkHandlers = observer<Props>(function NetworkHandlers({ networkHandlers, networkHandlersConfig, allowSaveCredentials, disabled }) {
  const styles = useStyles(BASE_CONTAINERS_STYLES);

  if (!networkHandlers.length) {
    return null;
  }

  return styled(styles)(
    <Group gap small>
      {networkHandlers.map(handler => (
        <NetworkHandlerAuthForm
          key={handler}
          id={handler}
          networkHandlersConfig={networkHandlersConfig}
          allowSaveCredentials={allowSaveCredentials}
          disabled={disabled}
        />
      ))}
    </Group>
  );
});
