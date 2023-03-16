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
import { CommonDialogBody, CommonDialogFooter, CommonDialogHeader, CommonDialogWrapper, DialogComponent } from '@cloudbeaver/core-dialogs';

const styles = css`
  p {
    margin: 0;
  }
  CommonDialogFooter {
    align-items: center;
    justify-content: flex-end;
  }
`;

export const SessionExpireWarningDialog: DialogComponent<null, null> = observer(function SessionExpireWarningDialog({
  rejectDialog,
}) {
  const translate = useTranslate();

  return styled(styles)(
    <CommonDialogWrapper size='small' fixedSize>
      <CommonDialogHeader title="app_root_session_expire_warning_title" onReject={rejectDialog} />
      <CommonDialogBody noOverflow>
        <p>{translate('app_root_session_expire_warning_message')}</p>
      </CommonDialogBody>
      <CommonDialogFooter>
        <Button
          type="button"
          mod={['unelevated']}
          onClick={rejectDialog}
        >
          {translate('app_root_session_expire_warning_button')}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
