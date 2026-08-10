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
  useStateDelay,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { ConnectionDialectResource, ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import type { DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { EObjectFeature, NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { download, withTimestamp } from '@dbeaver/js-helpers';
import { useCodemirrorExtensions } from '@cloudbeaver/plugin-codemirror6';
import { SqlEditorNavigatorService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';
import { SQLCodeEditor, useSqlDialectExtension } from '@cloudbeaver/plugin-sql-editor-codemirror';

import { action, observable } from 'mobx';
import { NotificationService } from '@cloudbeaver/core-events';
import type { SqlQueryGeneratorOptions } from '@cloudbeaver/core-sdk';

import { DDL_GENERATOR_ID } from './SqlGeneratorsResource.js';

interface Payload {
  nodeId: string;
  nodeName?: string;
  generatorId: string;
  generatorName?: string;
  query: string;
  options?: SqlQueryGeneratorOptions;
  regenerateQuery: (options: SqlQueryGeneratorOptions) => Promise<string>;
}

export const GeneratedSqlDialog = observer<DialogComponentProps<Payload>>(function GeneratedSqlDialog({ rejectDialog, payload }) {
  const translate = useTranslate();
  const copy = useClipboard();
  const notificationService = useService(NotificationService);

  const state = useObservableRef(
    () => ({
      useFullyQualifiedNames: payload.options?.useFullyQualifiedNames ?? true,
      compactSql: payload.options?.compactSql ?? false,
      showFullDdl: payload.options?.showFullDdl,
      query: payload.query,
      loading: false,
      handleOptionChange: async function handleOptionChange<T extends keyof typeof state>(key: T, value: (typeof state)[T]) {
        this[key] = value;
        this.loading = true;

        try {
          this.query = await this.payload.regenerateQuery({
            compactSql: this.compactSql,
            useFullyQualifiedNames: this.useFullyQualifiedNames,
            showFullDdl: this.showFullDdl,
          });
        } catch (error: any) {
          this.notificationService.logException(error, 'app_shared_sql_generators_error_title');
        } finally {
          this.loading = false;
        }
      },
    }),
    {
      handleOptionChange: action.bound,
      useFullyQualifiedNames: observable.ref,
      compactSql: observable.ref,
      showFullDdl: observable.ref,
      query: observable.ref,
      loading: observable.ref,
    },
    {
      payload,
      notificationService,
    },
  );

  const connectionInfoResource = useService(ConnectionInfoResource);
  const sqlEditorNavigatorService = useService(SqlEditorNavigatorService);
  const navNodeManagerService = useService(NavNodeManagerService);
  const connection = connectionInfoResource.getConnectionForNode(payload.nodeId);

  const connectionDialectResource = useResource(GeneratedSqlDialog, ConnectionDialectResource, connection ? createConnectionParam(connection) : null);
  const sqlDialect = useSqlDialectExtension(connectionDialectResource.data);

  const extensions = useCodemirrorExtensions();
  if (sqlDialect) {
    extensions.set(...sqlDialect);
  }

  const visibleLoading = useStateDelay(state.loading, 300);
  const isDdlGenerator = payload.generatorId.toLowerCase().includes(DDL_GENERATOR_ID.toLowerCase());
  const node = navNodeManagerService.getNode(payload.nodeId);
  const supportsFullDdl = node?.objectFeatures.includes(EObjectFeature.supportsFullDdl) ?? false;
  const hasFullDdl = isDdlGenerator && supportsFullDdl;

  async function handleOpenInEditor() {
    try {
      const container = navNodeManagerService.getNodeContainerInfo(payload.nodeId);

      await sqlEditorNavigatorService.openNewEditor({
        connectionKey: connection ? createConnectionParam(connection) : undefined,
        catalogId: container.catalogId,
        schemaId: container.schemaId,
        query: state.query,
      });
      rejectDialog();
    } catch (error: any) {
      notificationService.logException(error, 'app_shared_sql_generators_error_open_editor');
    }
  }

  function handleSaveToFile() {
    const blob = new Blob([state.query], { type: 'application/sql' });
    const name = [payload.nodeName, payload.generatorName].join('-') || 'Generated';

    download(blob, `${withTimestamp(name)}.sql`);
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
                disabled={visibleLoading}
                label={translate('app_shared_sql_generators_use_fully_qualified_names')}
                onChange={value => state.handleOptionChange('useFullyQualifiedNames', value)}
              />
              <Checkbox
                id="compact-sql"
                disabled={visibleLoading}
                label={translate('app_shared_sql_generators_compact_sql')}
                onChange={value => state.handleOptionChange('compactSql', value)}
              />
              {hasFullDdl && (
                <Checkbox
                  id="show-full-ddl"
                  disabled={visibleLoading}
                  label={translate('app_shared_sql_generators_full_ddl')}
                  onChange={value => state.handleOptionChange('showFullDdl', value)}
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
                disabled={!state.query || visibleLoading}
                className="tw:aspect-square tw:!min-w-0 tw:!px-0"
                onClick={handleSaveToFile}
              />
              <Button
                variant="secondary"
                icon="copy"
                title={translate('ui_copy_to_clipboard')}
                disabled={!state.query || visibleLoading}
                className="tw:aspect-square tw:!min-w-0 tw:!px-0"
                onClick={() => copy(state.query, true)}
              />
            </div>
            <div className="tw:flex tw:items-center tw:gap-6">
              <Button variant="secondary" disabled={!state.query || visibleLoading} onClick={handleOpenInEditor}>
                {translate('app_shared_sql_generators_open_in_editor')}
              </Button>
              <Button onClick={() => rejectDialog()}>{translate('ui_close')}</Button>
            </div>
          </div>
        </div>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
