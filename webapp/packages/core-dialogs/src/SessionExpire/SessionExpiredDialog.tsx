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

import { Button } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { CommonDialogWrapper } from '../CommonDialog/CommonDialog/CommonDialogWrapper';
import { DialogComponentProps } from '../CommonDialog/CommonDialogService';

const styles = css`
  dialog-content {
    display: flex;
    height: 150px;
    justify-content: center;
    align-items: center;
  }
  controls {
    display: flex;
    flex: 1;
    height: 100%;
    align-items: center;
    margin: auto;
    justify-content: flex-end;
  }
`;

export const SessionExpiredDialog = observer(function SessionExpiredDialog({
  rejectDialog,
}: DialogComponentProps<null, null>) {
  const translate = useTranslate();
  const title = translate('app_root_session_expired_title');
  const reload = useCallback(() => window.location.reload(), []);

  return styled(useStyles(styles))(
    <CommonDialogWrapper
      title={title}
      footer={(
        <controls as="div">
          <Button
            type="button"
            mod={['unelevated']}
            onClick={reload}
          >
            {translate('app_root_session_expired_reload')}
          </Button>
        </controls>
      )}
      onReject={rejectDialog}
    >
      <dialog-content as="div">
        <div>{translate('app_root_session_expired_message')}</div>
      </dialog-content>
    </CommonDialogWrapper>
  );
});
