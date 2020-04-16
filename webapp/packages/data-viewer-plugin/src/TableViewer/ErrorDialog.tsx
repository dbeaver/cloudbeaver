/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import { Button, SanitizedHTML } from '@dbeaver/core/blocks';
import { CommonDialogWrapper, DialogComponent, DialogComponentProps } from '@dbeaver/core/dialogs';
import { useStyles } from '@dbeaver/core/theming';

const styles = css`
  controls {
    display: flex;
    height: 100%;
    align-items: center;
  }

  fill {
    flex: 1;
  }

  message {
    display: flex;
    max-height: 120px;
    overflow: auto;
  }

  Button:not(:first-child) {
    margin-left: 24px;
  }
`;

export type ErrorDialogPayload = {
  message: string;
  onShowDetails?: () => void;
}

export const ErrorDialog: DialogComponent<ErrorDialogPayload, boolean> = observer(
  function ErrorDialog({
    rejectDialog, resolveDialog, payload,
  }: DialogComponentProps<ErrorDialogPayload, boolean>) {
    const handleRetry = useCallback(() => resolveDialog(true), [resolveDialog]);

    return styled(useStyles(styles))(
      <CommonDialogWrapper
        title={'Error when saving changes'}
        onReject={rejectDialog}
        footer={(
          <controls as="div">
            {payload.onShowDetails && <Button type="button" mod={['outlined']} onClick={payload.onShowDetails}>Details</Button>}
            <fill as="div"/>
            <Button type="button" mod={['outlined']} onClick={rejectDialog}>Cancel</Button>
            <Button type="button" mod={['unelevated']} onClick={handleRetry}>Retry</Button>
          </controls>
        )}
      >
        <message as="div"><SanitizedHTML html={payload.message}/></message>
      </CommonDialogWrapper>
    );
  }
);
