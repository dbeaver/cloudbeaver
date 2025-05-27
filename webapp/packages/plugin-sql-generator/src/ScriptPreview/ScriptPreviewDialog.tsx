/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  Fill,
  s,
  useClipboard,
  useResource,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { ConnectionDialectResource, type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import type { DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useCodemirrorExtensions } from '@cloudbeaver/plugin-codemirror6';
import { SQLCodeEditorLoader, useSqlDialectExtension } from '@cloudbeaver/plugin-sql-editor-new';

import style from './ScriptPreviewDialog.module.css';

interface Payload {
  script: string;
  connectionKey: IConnectionInfoParams | null;
  onApply: () => Promise<void>;
}

export const ScriptPreviewDialog = observer<DialogComponentProps<Payload>>(function ScriptPreviewDialog({ rejectDialog, resolveDialog, payload }) {
  const translate = useTranslate();
  const copy = useClipboard();
  const styles = useS(style);

  const dialect = useResource(ScriptPreviewDialog, ConnectionDialectResource, payload.connectionKey);
  const sqlDialect = useSqlDialectExtension(dialect.data);
  const extensions = useCodemirrorExtensions();
  extensions.set(...sqlDialect);

  const apply = async () => {
    try {
      await payload.onApply();
      resolveDialog();
    } catch {}
  };

  return (
    <CommonDialogWrapper size="large">
      <CommonDialogHeader title="data_viewer_script_preview_dialog_title" icon="sql-script" onReject={rejectDialog} />
      <CommonDialogBody noBodyPadding noOverflow>
        <div className={s(styles, { wrapper: true })}>
          <SQLCodeEditorLoader
            className={s(styles, { sqlCodeEditorLoader: true })}
            value={payload.script}
            extensions={extensions}
            lineNumbers
            readonly
          />
        </div>
      </CommonDialogBody>
      <CommonDialogFooter className={s(styles, { footer: true })}>
        <Button onClick={apply}>{translate('ui_apply')}</Button>
        <Fill />
        <Button variant="secondary" onClick={() => copy(payload.script, true)}>
          {translate('ui_copy_to_clipboard')}
        </Button>
        <Button onClick={rejectDialog}>{translate('ui_close')}</Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
