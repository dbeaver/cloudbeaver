/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { Button } from '@cloudbeaver/core-blocks';
import { CommonDialogWrapper, DialogComponent } from '@cloudbeaver/core-dialogs';
import { Translate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

const style = css`
  footer {
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
  return styled(useStyles(style))(
    <CommonDialogWrapper
      size='small'
      title='ui_changes_might_be_lost'
      className={className}
      style={style}
      footer={(
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
      )}
      fixedWidth
      onReject={rejectDialog}
    >
      <Translate token='sql_editor_upload_script_unsaved_changes_dialog_message' />
    </CommonDialogWrapper>
  );
};
