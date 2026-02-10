/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
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
  s,
  useClipboard,
  useResource,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { ConnectionDialectResource, ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import type { DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useCodemirrorExtensions } from '@cloudbeaver/plugin-codemirror6';
import { SQLCodeEditor, useSqlDialectExtension } from '@cloudbeaver/plugin-sql-editor-codemirror';

import style from './GeneratedSqlDialog.module.css';

interface Payload {
  nodeId: string;
  query: string;
}

export const GeneratedSqlDialog = observer<DialogComponentProps<Payload>>(function GeneratedSqlDialog({ rejectDialog, payload }) {
  const translate = useTranslate();
  const copy = useClipboard();
  const styles = useS(style);

  const connectionInfoResource = useService(ConnectionInfoResource);
  const connection = connectionInfoResource.getConnectionForNode(payload.nodeId);

  const connectionDialectResource = useResource(GeneratedSqlDialog, ConnectionDialectResource, connection ? createConnectionParam(connection) : null);
  const sqlDialect = useSqlDialectExtension(connectionDialectResource.data);

  const extensions = useCodemirrorExtensions();
  if (sqlDialect) {
    extensions.set(...sqlDialect);
  }

  return (
    <CommonDialogWrapper size="large">
      <CommonDialogHeader title="app_shared_sql_generators_dialog_title" icon="sql-script" onReject={rejectDialog} />
      <CommonDialogBody noOverflow noBodyPadding>
        <div className={s(styles, { wrapper: true })}>
          <SQLCodeEditor className={s(styles, { sqlCodeEditorLoader: true })} value={payload.query} extensions={extensions} readonly />
        </div>
      </CommonDialogBody>
      <CommonDialogFooter>
        <div className={s(styles, { footerContainer: true })}>
          <div className={s(styles, { buttons: true })}>
            <Button variant="secondary" disabled={!payload.query} onClick={() => copy(payload.query, true)}>
              {translate('ui_copy_to_clipboard')}
            </Button>
            <Button onClick={() => rejectDialog()}>{translate('ui_close')}</Button>
          </div>
        </div>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
