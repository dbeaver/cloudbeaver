/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import { Button } from '@cloudbeaver/core-blocks';
import { CommonDialogWrapper, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

const styles = css`
  CommonDialogWrapper {
    width: 400px;
    min-width: auto;
  }
  controls {
    display: flex;
    flex: 1;
    height: 100%;
    align-items: center;
    margin: auto;
    justify-content: flex-end;
  }
  p {
    margin: 0;
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
        <controls>
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
      <p>{translate('app_root_session_expired_message')}</p>
    </CommonDialogWrapper>
  );
});
