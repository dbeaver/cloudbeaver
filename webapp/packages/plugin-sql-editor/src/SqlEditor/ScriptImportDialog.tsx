/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { Button, Translate } from '@cloudbeaver/core-blocks';
import { CommonDialogBody, CommonDialogFooter, CommonDialogHeader, CommonDialogWrapper, DialogComponent } from '@cloudbeaver/core-dialogs';

const style = css`
  CommonDialogFooter {
    align-items: center;
  }

  container {
    width: 100%;
    display: flex;
    gap: 16px;
  }

  fill {
    flex: 1;
  }
`;

export const ScriptImportDialog: DialogComponent<null, boolean> = function ScriptImportDialog({
  resolveDialog,
  rejectDialog,
  className,
}) {
  return styled(style)(
    <CommonDialogWrapper size='small' className={className} fixedWidth>
      <CommonDialogHeader title='ui_changes_might_be_lost' onReject={rejectDialog} />
      <CommonDialogBody>
        <Translate token='sql_editor_upload_script_unsaved_changes_dialog_message' />
      </CommonDialogBody>
      <CommonDialogFooter>
        <container>
          <Button
            type="button"
            mod={['outlined']}
            onClick={rejectDialog}
          >
            <Translate token='ui_processing_cancel' />
          </Button>
          <fill />
          <Button
            type="button"
            mod={['outlined']}
            onClick={() => resolveDialog(false)}
          >
            <Translate token='ui_no' />
          </Button>
          <Button
            type="button"
            mod={['unelevated']}
            onClick={() => resolveDialog(true)}
          >
            <Translate token='ui_yes' />
          </Button>
        </container>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
};
