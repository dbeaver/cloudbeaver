/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  Fill,
  s,
  Translate,
  useS,
} from '@cloudbeaver/core-blocks';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';

import style from './ScriptImportDialog.module.css';

export const ScriptImportDialog: DialogComponent<null, boolean> = function ScriptImportDialog({ resolveDialog, rejectDialog, className }) {
  const styles = useS(style);

  return (
    <CommonDialogWrapper size="small" className={className} fixedWidth>
      <CommonDialogHeader title="ui_changes_might_be_lost" onReject={rejectDialog} />
      <CommonDialogBody>
        <Translate token="sql_editor_upload_script_unsaved_changes_dialog_message" />
      </CommonDialogBody>
      <CommonDialogFooter className={s(styles, { footer: true })}>
        <div className={s(styles, { container: true })}>
          <Button type="button" variant="secondary" onClick={rejectDialog}>
            <Translate token="ui_processing_cancel" />
          </Button>
          <Fill />
          <Button type="button" variant="secondary" onClick={() => resolveDialog(false)}>
            <Translate token="ui_no" />
          </Button>
          <Button type="button" onClick={() => resolveDialog(true)}>
            <Translate token="ui_yes" />
          </Button>
        </div>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
};
