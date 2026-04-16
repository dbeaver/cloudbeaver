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
  Checkbox,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  useClipboard,
  useObservableRef,
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { ConnectionDialectResource, ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import type { DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useCodemirrorExtensions } from '@cloudbeaver/plugin-codemirror6';
import { SqlEditorNavigatorService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';
import { SQLCodeEditor, useSqlDialectExtension } from '@cloudbeaver/plugin-sql-editor-codemirror';

import { SqlGeneratorsResource } from './SqlGeneratorsResource.js';
import { observable } from 'mobx';
import { NotificationService } from '@cloudbeaver/core-events';
import type { SqlQueryGeneratorOptions } from '@cloudbeaver/core-sdk';

interface Payload {
  nodeId: string;
  query: string;
  generatorId: string;
  options?: SqlQueryGeneratorOptions;
}

export const GeneratedSqlDialog = observer<DialogComponentProps<Payload>>(function GeneratedSqlDialog({ rejectDialog, payload }) {
  const translate = useTranslate();
  const copy = useClipboard();

  const state = useObservableRef(
    () => ({
      useFullyQualifiedNames: payload.options?.useFullyQualifiedNames ?? true,
      compactSql: payload.options?.compactSql ?? false,
      query: payload.query,
      loading: false,
    }),
    {
      useFullyQualifiedNames: observable.ref,
      compactSql: observable.ref,
      query: observable.ref,
      loading: observable.ref,
    },
    false,
  );

  const connectionInfoResource = useService(ConnectionInfoResource);
  const sqlGeneratorsResource = useService(SqlGeneratorsResource);
  const sqlEditorNavigatorService = useService(SqlEditorNavigatorService);
  const notificationService = useService(NotificationService);
  const connection = connectionInfoResource.getConnectionForNode(payload.nodeId);

  const connectionDialectResource = useResource(GeneratedSqlDialog, ConnectionDialectResource, connection ? createConnectionParam(connection) : null);
  const sqlDialect = useSqlDialectExtension(connectionDialectResource.data);

  const extensions = useCodemirrorExtensions();
  if (sqlDialect) {
    extensions.set(...sqlDialect);
  }

  async function regenerateQuery() {
    state.loading = true;
    try {
      const newQuery = await sqlGeneratorsResource.generateEntityQuery(payload.generatorId, payload.nodeId, {
        compactSql: state.compactSql,
        useFullyQualifiedNames: state.useFullyQualifiedNames,
      });
      state.query = newQuery;
    } catch (error: any) {
      notificationService.logException(error, 'app_shared_sql_generators_error_title');
    } finally {
      state.loading = false;
    }
  }

  async function handleOpenInEditor() {
    if (connection) {
      await sqlEditorNavigatorService.openNewEditor({
        connectionKey: createConnectionParam(connection),
        query: state.query,
      });
      rejectDialog();
    }
  }

  async function handleFullyQualifiedNamesChange(value: boolean) {
    state.useFullyQualifiedNames = value;
    await regenerateQuery();
  }

  async function handleCompactSqlChange(value: boolean) {
    state.compactSql = value;
    await regenerateQuery();
  }

  return (
    <CommonDialogWrapper size="large">
      <CommonDialogHeader title="app_shared_sql_generators_dialog_title" icon="sql-script" onReject={rejectDialog} />
      <CommonDialogBody noOverflow noBodyPadding>
        <div className="tw:flex tw:items-center tw:h-full tw:w-full tw:overflow-auto">
          <SQLCodeEditor className="tw:h-full tw:w-full" value={state.query} extensions={extensions} readonly />
        </div>
      </CommonDialogBody>
      <CommonDialogFooter>
        <div className="tw:flex tw:flex-col tw:w-full tw:gap-6">
          <div className="tw:flex tw:flex-col tw:gap-1 tw:w-full">
            <div className="tw:flex tw:flex-row tw:gap-3 tw:w-full">
              <Checkbox
                id="use-fully-qualified-names"
                state={state}
                name="useFullyQualifiedNames"
                disabled={state.loading}
                label={translate('app_shared_sql_generators_use_fully_qualified_names')}
                onChange={handleFullyQualifiedNamesChange}
              />

              <Checkbox
                id="compact-sql"
                state={state}
                name="compactSql"
                disabled={state.loading}
                label={translate('app_shared_sql_generators_compact_sql')}
                onChange={handleCompactSqlChange}
              />
            </div>
          </div>
          <div className="tw:flex tw:justify-end tw:w-full tw:gap-6">
            <Button variant="secondary" disabled={!state.query || state.loading} onClick={() => copy(state.query, true)}>
              {translate('ui_copy_to_clipboard')}
            </Button>
            {connection && (
              <Button variant="secondary" disabled={!state.query || state.loading} onClick={handleOpenInEditor}>
                {translate('app_shared_sql_generators_open_in_editor')}
              </Button>
            )}
            <Button onClick={() => rejectDialog()}>{translate('ui_close')}</Button>
          </div>
        </div>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
