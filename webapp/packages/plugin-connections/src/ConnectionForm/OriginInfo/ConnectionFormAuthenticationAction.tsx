/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { Button, PlaceholderComponent } from '@cloudbeaver/core-blocks';
import { isLocalConnection } from '@cloudbeaver/core-connections';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useAuthenticationAction } from '@cloudbeaver/core-ui';

import type { IConnectionFormProps } from '../IConnectionFormProps';

export const AuthenticationButton: PlaceholderComponent<IConnectionFormProps> = observer(function ConnectionFormAuthenticationAction({
  state,
}) {
  const translate = useTranslate();
  const authentication = useAuthenticationAction({
    origin: state.info?.origin ?? { type: AUTH_PROVIDER_LOCAL_ID, displayName: 'Local' },
    onAuthenticate: () => state.loadConnectionInfo(),
  });

  if (authentication.authorized) {
    return null;
  }

  return (
    <Button
      type="button"
      disabled={state.disabled}
      mod={['outlined']}
      onClick={authentication.auth}
    >
      {translate('authentication_authenticate')}
    </Button>
  );
});

export const ConnectionFormAuthenticationAction: PlaceholderComponent<IConnectionFormProps> = observer(function ConnectionFormAuthenticationAction({
  state,
}) {
  if (!state.info || isLocalConnection(state.info)) {
    return null;
  }

  return <AuthenticationButton state={state} />;
});
