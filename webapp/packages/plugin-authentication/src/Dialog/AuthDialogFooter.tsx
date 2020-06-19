/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { Button } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';

const styles = css`
  controls {
    display: flex;
    height: 100%;
    flex: 1;
    align-items: center;
    margin: auto;
    justify-content: flex-end;
  }
`;

export type Props = {
  isAuthenticating: boolean;
  onLogin(): void;
}

export const AuthDialogFooter = observer(
  function AuthDialogFooter({
    isAuthenticating,
    onLogin,
  }: Props) {
    const translate = useTranslate();

    return styled(styles)(
      <controls as="div">
        <Button
          type="button"
          mod={['unelevated']}
          onClick={onLogin}
          disabled={isAuthenticating}
        >
          {translate('authentication_login')}
        </Button>
      </controls>
    );
  }
);
