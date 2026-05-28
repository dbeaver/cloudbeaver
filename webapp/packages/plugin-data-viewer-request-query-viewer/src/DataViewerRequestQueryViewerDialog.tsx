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
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { useService } from '@cloudbeaver/core-di';
import { useCodemirrorExtensions } from '@cloudbeaver/plugin-codemirror6';
import { LocalStorageSqlDataSource } from '@cloudbeaver/plugin-sql-editor';
import { SQLCodeEditor, useSqlDialectExtension } from '@cloudbeaver/plugin-sql-editor-codemirror';
import { ConnectionDialectResource, ConnectionInfoResource, type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { NavNodeManagerService, NodeManagerUtils } from '@cloudbeaver/core-navigation-tree';
import { SqlEditorNavigatorService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

interface IPayload {
  query: string;
  connectionKey: IConnectionInfoParams;
}

export const DataViewerRequestQueryViewerDialog: DialogComponent<IPayload> = observer(function DataViewerRequestQueryViewerDialog(props) {
  const sqlEditorNavigatorService = useService(SqlEditorNavigatorService);
  const navNodeManagerService = useService(NavNodeManagerService);
  const connectionInfoResource = useService(ConnectionInfoResource);

  const translate = useTranslate();
  const connectionDialectResource = useResource(DataViewerRequestQueryViewerDialog, ConnectionDialectResource, props.payload.connectionKey);
  const sqlDialect = useSqlDialectExtension(connectionDialectResource.data);
  const extensions = useCodemirrorExtensions();

  if (sqlDialect) {
    extensions.set(...sqlDialect);
  }

  function openSqlEditor() {
    const nodeId = NodeManagerUtils.connectionIdToConnectionNodeId(props.payload.connectionKey.connectionId);
    const container = navNodeManagerService.getNodeContainerInfo(nodeId);
    const connection = connectionInfoResource.get(props.payload.connectionKey);
    const name = connection?.name ? '<' + connection.name + '> ' : 'SQL';

    sqlEditorNavigatorService.openNewEditor({
      name,
      dataSourceKey: LocalStorageSqlDataSource.key,
      connectionKey: props.payload.connectionKey,
      catalogId: container.catalogId,
      schemaId: container.schemaId,
      query: props.payload.query,
    });

    props.rejectDialog();
  }

  return (
    <CommonDialogWrapper size="large" fixedWidth>
      <CommonDialogHeader title="SQL" onReject={props.rejectDialog} />
      <CommonDialogBody noBodyPadding noOverflow>
        <SQLCodeEditor value={props.payload.query} extensions={extensions} readonly />
      </CommonDialogBody>
      <CommonDialogFooter className="tw:flex tw:justify-between">
        <Button variant="secondary" onClick={() => props.rejectDialog()}>
          {translate('ui_cancel')}
        </Button>
        <Button onClick={openSqlEditor}>
          {translate('ui_open')} {translate('sql_editor_script_editor')}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
