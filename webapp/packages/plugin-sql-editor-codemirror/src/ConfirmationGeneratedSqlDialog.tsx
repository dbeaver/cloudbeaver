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
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { ConnectionDialectResource, ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import type { DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useCodemirrorExtensions } from '@cloudbeaver/plugin-codemirror6';
import { SQLCodeEditor, useSqlDialectExtension } from '@cloudbeaver/plugin-sql-editor-codemirror';

interface Payload {
  nodeId: string;
  query: string;
  title?: string;
  message?: string;
  confirmActionText?: string;
  cancelActionText?: string;
}

export const ConfirmationGeneratedSqlDialog = observer<DialogComponentProps<Payload>>(function ConfirmationGeneratedSqlDialog({
  rejectDialog,
  resolveDialog,
  payload,
}) {
  const translate = useTranslate();

  const connectionInfoResource = useService(ConnectionInfoResource);
  const connection = connectionInfoResource.getConnectionForNode(payload.nodeId);

  const connectionDialectResource = useResource(
    ConfirmationGeneratedSqlDialog,
    ConnectionDialectResource,
    connection ? createConnectionParam(connection) : null,
  );
  const sqlDialect = useSqlDialectExtension(connectionDialectResource.data);

  const extensions = useCodemirrorExtensions();
  if (sqlDialect) {
    extensions.set(...sqlDialect);
  }

  return (
    <CommonDialogWrapper size="large">
      <CommonDialogHeader
        title={translate(payload.title) || translate('app_shared_sql_generators_dialog_title')}
        icon="sql-script"
        onReject={rejectDialog}
      />
      <CommonDialogBody noOverflow noBodyPadding>
        <div className="tw:flex-col tw:pl-8 tw:pr-8 theme-typography--body1 tw:w-full tw:h-full">
          <div>{translate(payload.message)}</div>
          <SQLCodeEditor className="tw:mt-4 tw:h-full tw:w-full tw:max-h-60" value={payload.query} extensions={extensions} readonly />
        </div>
      </CommonDialogBody>
      <CommonDialogFooter>
        <div className="tw:flex tw:w-min tw:flex-1 tw:items-center tw:justify-end tw:gap-6">
          <div className="tw:flex-none tw:flex tw:gap-6">
            <Button variant="secondary" onClick={() => rejectDialog()}>
              {translate(payload.cancelActionText || 'ui_no')}
            </Button>
            <Button onClick={() => resolveDialog()}>{translate(payload.confirmActionText || 'ui_yes')}</Button>
          </div>
        </div>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
