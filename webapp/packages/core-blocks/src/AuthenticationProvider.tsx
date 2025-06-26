/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useAuthenticationAction } from './useAuthenticationAction.js';
import { useTranslate } from './localization/useTranslate.js';
import { Container } from './Containers/Container.js';
import { Button } from './Button.js';

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
    return props.children?.() || null;
  }

  return (
    <Container className={props.className} gap vertical center>
      <Container keepSize center vertical gap dense>
        <Container keepSize>{translate('authentication_request_token')}</Container>
        <Container keepSize>
          <Button type="button" loading={action.authenticating} onClick={action.auth}>
            {translate('authentication_authenticate')}
          </Button>
        </Container>
      </Container>
    </Container>
  );
});
