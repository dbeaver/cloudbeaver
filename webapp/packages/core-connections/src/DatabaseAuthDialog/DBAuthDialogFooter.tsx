/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Button, ErrorMessage } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { GQLErrorCatcher } from '@cloudbeaver/core-sdk';
import { composes, useStyles } from '@cloudbeaver/core-theming';

const styles = composes(
  css`
    ErrorMessage {
      composes: theme-background-secondary from global;
    }
  `,
  css`
    controls {
      display: flex;
      height: 100%;
      flex: 1;
      align-items: center;
      justify-content: flex-end;
    }
    ErrorMessage {
      flex: 0.9;
      & + controls {
        margin-left: 17px;
        flex: 0.1;
      }
    }
`);

export interface Props {
  isAuthenticating: boolean;
  onLogin: () => void;
  error?: GQLErrorCatcher;
  onShowDetals?: () => void;
}

export const DBAuthDialogFooter = observer(function DBAuthDialogFooter({
  isAuthenticating,
  onLogin,
  error,
  onShowDetals,
}: Props) {
  const translate = useTranslate();

  return styled(useStyles(styles))(
    <>
      {error?.responseMessage && (
        <ErrorMessage
          text={error.responseMessage}
          hasDetails={error.hasDetails}
          onShowDetails={onShowDetals}
        />
      )}
      <controls>
        <Button
          type="button"
          mod={['unelevated']}
          disabled={isAuthenticating}
          onClick={onLogin}
        >
          {translate('authentication_login')}
        </Button>
      </controls>
    </>
  );
});
