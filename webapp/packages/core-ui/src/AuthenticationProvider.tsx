/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Button, Container, useTranslate } from '@cloudbeaver/core-blocks';

import { useAuthenticationAction } from './useAuthenticationAction.js';

export type Props = {
  providerId: string;
  className?: string;
  children?: () => React.ReactNode;
  onAuthenticate?: () => void;
  onClose?: () => void;
};

export const AuthenticationProvider = observer<Props>(function AuthenticationProvider(props) {
  const translate = useTranslate();
  const action = useAuthenticationAction(props);

  if (action.authorized) {
    return (props.children?.() as null) || null;
  }

  return (
    <Container className={props.className} gap vertical center>
      <Container keepSize center vertical gap dense>
        <Container keepSize>{translate('authentication_request_token')}</Container>
        <Container keepSize>
          <Button type="button" mod={['unelevated']} loading={action.authenticating} onClick={action.auth}>
            {translate('authentication_authenticate')}
          </Button>
        </Container>
      </Container>
    </Container>
  );
});
