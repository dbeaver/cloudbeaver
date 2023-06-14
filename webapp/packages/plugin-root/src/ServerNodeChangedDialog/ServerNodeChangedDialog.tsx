/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Button, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogBody, CommonDialogFooter, CommonDialogHeader, CommonDialogWrapper, DialogComponent } from '@cloudbeaver/core-dialogs';
import { RouterService } from '@cloudbeaver/core-routing';

const styles = css`
  p {
    margin: 0;
  }
  CommonDialogFooter {
    align-items: center;
    justify-content: flex-end;
    gap: 16px;
  }
`;

export const ServerNodeChangedDialog: DialogComponent<null, null> = observer(function ServerNodeChangedDialog({ rejectDialog }) {
  const routerService = useService(RouterService);
  const translate = useTranslate();
  function reload() {
    routerService.reload();
  }

  return styled(styles)(
    <CommonDialogWrapper size="small" fixedSize>
      <CommonDialogHeader title="app_root_server_node_changed_title" onReject={rejectDialog} />
      <CommonDialogBody noOverflow>
        <p>{translate('app_root_server_node_changed_message')}</p>
      </CommonDialogBody>
      <CommonDialogFooter>
        <Button type="button" mod={['outlined']} onClick={rejectDialog}>
          {translate('ui_processing_cancel')}
        </Button>
        <Button type="button" mod={['unelevated']} onClick={reload}>
          {translate('ui_processing_reload')}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>,
  );
});
