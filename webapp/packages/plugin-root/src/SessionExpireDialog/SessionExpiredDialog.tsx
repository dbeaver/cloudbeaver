/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Button, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogWrapper, DialogComponent } from '@cloudbeaver/core-dialogs';
import { RouterService } from '@cloudbeaver/core-routing';



const dialogStyle = css`
  footer {
    align-items: center;
    justify-content: flex-end;
    gap: 24px;
  }
`;

const styles = css`
  p {
    margin: 0;
  }
`;

export const SessionExpiredDialog: DialogComponent<null, null> = observer(function SessionExpiredDialog({
  rejectDialog,
}) {
  const routerService = useService(RouterService);
  const translate = useTranslate();
  function reload() {
    routerService.reload();
  }

  return styled(styles)(
    <CommonDialogWrapper
      size='small'
      title='app_root_session_expired_title'
      footer={(
        <Button
          type="button"
          mod={['unelevated']}
          onClick={reload}
        >
          {translate('app_root_session_expired_reload')}
        </Button>
      )}
      style={dialogStyle}
      fixedSize
      noOverflow
      onReject={rejectDialog}
    >
      <p>{translate('app_root_session_expired_message')}</p>
    </CommonDialogWrapper>
  );
});
