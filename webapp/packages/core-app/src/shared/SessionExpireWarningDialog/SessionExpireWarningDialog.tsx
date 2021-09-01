/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Button } from '@cloudbeaver/core-blocks';
import { CommonDialogWrapper, DialogComponent } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

const styles = css`
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

export const SessionExpireWarningDialog: DialogComponent<null, null> = observer(function SessionExpireWarningDialog({
  rejectDialog,
}) {
  const translate = useTranslate();

  return styled(useStyles(styles))(
    <CommonDialogWrapper
      size='small'
      title={translate('app_root_session_expire_warning_title')}
      footer={(
        <controls>
          <Button
            type="button"
            mod={['unelevated']}
            onClick={rejectDialog}
          >
            {translate('app_root_session_expire_warning_button')}
          </Button>
        </controls>
      )}
      fixedSize
      noOverflow
      onReject={rejectDialog}
    >
      <p>{translate('app_root_session_expire_warning_message')}</p>
    </CommonDialogWrapper>
  );
});
