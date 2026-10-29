/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useRef } from 'react';

import {
  Button,
  Checkbox,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  ConfirmationDialog,
  Loader,
  useClipboard,
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { ConnectionDialectResource, ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult, type DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { download, withTimestamp } from '@dbeaver/js-helpers';
import { useCodemirrorExtensions } from '@cloudbeaver/plugin-codemirror6';
import { SqlEditorNavigatorService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';
import { SQLCodeEditor, useSqlDialectExtension } from '@cloudbeaver/plugin-sql-editor-codemirror';

import { NotificationService } from '@cloudbeaver/core-events';

import { SqlGeneratorsResource } from './SqlGeneratorsResource.js';

import { useGeneratedSql } from './useGeneratedSql.js';
import { getGeneratedSqlContext, type GeneratedSqlPayload } from './generatedSqlContext.js';

export const GeneratedSqlDialog = observer<DialogComponentProps<GeneratedSqlPayload>>(function GeneratedSqlDialog({ rejectDialog, payload }) {
  const translate = useTranslate();
  const copy = useClipboard();
  const notificationService = useService(NotificationService);
  const commonDialogService = useService(CommonDialogService);
  const closing = useRef(false);
  const sqlGeneratorsResource = useService(SqlGeneratorsResource);
  const state = useGeneratedSql({
    query: 'query' in payload ? payload.query : undefined,
    options: payload.options,
    generate:
      'regenerateQuery' in payload
        ? payload.regenerateQuery
        : options => sqlGeneratorsResource.generateEntityQuery(payload.generatorId, [...payload.nodeIds], options),
  });
  const { loading, busy } = state;

  const connectionInfoResource = useService(ConnectionInfoResource);
  const sqlEditorNavigatorService = useService(SqlEditorNavigatorService);
  const navNodeManagerService = useService(NavNodeManagerService);
  const { nodeIds, connection, catalogId, schemaId, hasFullDdl } = getGeneratedSqlContext(payload, navNodeManagerService, connectionInfoResource);

  const connectionKey = connection ? createConnectionParam(connection) : null;
  const connectionDialectResource = useResource(GeneratedSqlDialog, ConnectionDialectResource, connectionKey);
  const sqlDialect = useSqlDialectExtension(connectionDialectResource.data);

  const extensions = useCodemirrorExtensions();
  if (sqlDialect) {
    extensions.set(...sqlDialect);
  }

  const title = `${translate('app_shared_sql_generators_dialog_title')}${connection ? ` (${connection.name})` : ''}`;

  async function handleClose() {
    if (closing.current) {
      return;
    }
    closing.current = true;
    try {
      if (loading && state.canCancel) {
        const { status } = await commonDialogService.open(ConfirmationDialog, {
          title: 'app_shared_sql_generators_cancel_title',
          message: 'app_shared_sql_generators_cancel_message',
          confirmActionText: 'ui_cancel',
          cancelActionText: 'ui_continue',
        });
        if (status !== DialogueStateResult.Resolved) {
          return;
        }
      }
      await state.cancel();
      rejectDialog();
    } catch (error: any) {
      notificationService.logException(error, 'app_shared_sql_generators_error_title');
    } finally {
      closing.current = false;
    }
  }

  async function handleOpenInEditor() {
    try {
      await sqlEditorNavigatorService.openNewEditor({
        connectionKey: connectionKey ?? undefined,
        catalogId,
        schemaId,
        query: state.query,
      });
      rejectDialog();
    } catch (error: any) {
      notificationService.logException(error, 'app_shared_sql_generators_error_open_editor');
    }
  }

  function handleSaveToFile() {
    const blob = new Blob([state.query], { type: 'application/sql' });
    const name = [nodeIds.length === 1 ? payload.nodeName : connection?.name, payload.generatorName].filter(Boolean).join('-') || 'Generated';

    download(blob, `${withTimestamp(name)}.sql`);
  }

  return (
    <CommonDialogWrapper size="large" aria-label={title} onClose={handleClose}>
      <CommonDialogHeader title={title} icon="sql-script" onReject={handleClose} />
      <CommonDialogBody noOverflow noBodyPadding>
        {busy && (
          <div role="status" className="tw:flex tw:flex-1 tw:items-center tw:justify-center tw:w-full">
            <Loader message="app_shared_sql_generators_generating" />
          </div>
        )}
        {!busy && state.error && !state.query && (
          <div role="alert" className="tw:p-4">
            {translate('app_shared_sql_generators_error_title')}
            <Button onClick={() => state.generate()}>{translate('app_shared_sql_generators_retry')}</Button>
          </div>
        )}
        {!busy && (!state.error || !!state.query) && (
          <div className="tw:flex tw:items-center tw:h-full tw:w-full tw:overflow-auto">
            <SQLCodeEditor className="tw:h-full tw:w-full" value={state.query} extensions={extensions} readonly />
          </div>
        )}
      </CommonDialogBody>
      <CommonDialogFooter>
        <div className="tw:flex tw:flex-col tw:w-full tw:gap-6">
          <div className="tw:flex tw:flex-col tw:gap-1 tw:w-full">
            <div className="tw:flex tw:flex-row tw:gap-3 tw:w-full">
              <Checkbox
                id="use-fully-qualified-names"
                disabled={busy}
                checked={state.options.useFullyQualifiedNames ?? true}
                label={translate('app_shared_sql_generators_use_fully_qualified_names')}
                onChange={value => state.generate({ ...state.options, useFullyQualifiedNames: value })}
              />
              <Checkbox
                id="compact-sql"
                disabled={busy}
                checked={state.options.compactSql ?? false}
                label={translate('app_shared_sql_generators_compact_sql')}
                onChange={value => state.generate({ ...state.options, compactSql: value })}
              />
              {hasFullDdl && (
                <Checkbox
                  id="show-full-ddl"
                  disabled={busy}
                  checked={state.options.showFullDdl ?? false}
                  label={translate('app_shared_sql_generators_full_ddl')}
                  onChange={value => state.generate({ ...state.options, showFullDdl: value })}
                />
              )}
            </div>
          </div>
          <div className="tw:flex tw:items-center tw:justify-between tw:w-full tw:gap-6">
            <div className="tw:flex tw:items-center tw:gap-2">
              <Button
                variant="secondary"
                icon="/icons/export.svg"
                title={translate('ui_download')}
                disabled={!state.query || busy}
                className="tw:aspect-square tw:!min-w-0 tw:!px-0"
                onClick={handleSaveToFile}
              />
              <Button
                variant="secondary"
                icon="copy"
                title={translate('ui_copy_to_clipboard')}
                disabled={!state.query || busy}
                className="tw:aspect-square tw:!min-w-0 tw:!px-0"
                onClick={() => copy(state.query, true)}
              />
            </div>
            <div className="tw:flex tw:items-center tw:gap-6">
              <Button variant="secondary" disabled={!state.query || busy} onClick={handleOpenInEditor}>
                {translate('app_shared_sql_generators_open_in_editor')}
              </Button>
              <Button onClick={handleClose}>{translate('ui_close')}</Button>
            </div>
          </div>
        </div>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
