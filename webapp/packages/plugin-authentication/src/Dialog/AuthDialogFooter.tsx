/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Button } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';

const styles = css`
  footer-container {
    display: flex;
    width: min-content;
    flex: 1;
    align-items: center;
    justify-content: flex-end;
  }
  footer-container > :not(:first-child) {
    margin-left: 16px;
  }
  Button {
    flex: 0 0 auto;
  }
`;

export interface Props {
  authAvailable: boolean;
  isAuthenticating: boolean;
  onLogin: () => void;
}

export const AuthDialogFooter = observer<Props>(function AuthDialogFooter({
  authAvailable,
  isAuthenticating,
  onLogin,
  children,
}) {
  const translate = useTranslate();

  return styled(styles)(
    <footer-container>
      {children}
      <Button
        type="button"
        mod={['unelevated']}
        loading={isAuthenticating}
        hidden={!authAvailable}
        onClick={onLogin}
      >
        {translate('authentication_login')}
      </Button>
    </footer-container>
  );
});
