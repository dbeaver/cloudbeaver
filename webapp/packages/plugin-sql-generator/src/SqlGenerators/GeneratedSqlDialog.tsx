/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  ErrorMessage,
  Loader,
  s,
  useClipboard,
  useErrorDetails,
  useObservableRef,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import type { DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { GQLErrorCatcher, type SqlDialectInfo } from '@cloudbeaver/core-sdk';
import { useCodemirrorExtensions } from '@cloudbeaver/plugin-codemirror6';
import { SqlDialectInfoService } from '@cloudbeaver/plugin-sql-editor';
import { SQLCodeEditorLoader, useSqlDialectExtension } from '@cloudbeaver/plugin-sql-editor-new';

import style from './GeneratedSqlDialog.module.css';
import { SqlGeneratorsResource } from './SqlGeneratorsResource.js';

interface Payload {
  generatorId: string;
  pathId: string;
}

export const GeneratedSqlDialog = observer<DialogComponentProps<Payload>>(function GeneratedSqlDialog({ rejectDialog, payload }) {
  const translate = useTranslate();
  const copy = useClipboard();
  const styles = useS(style);

  const sqlDialectInfoService = useService(SqlDialectInfoService);
  const sqlGeneratorsResource = useService(SqlGeneratorsResource);
  const connectionInfoResource = useService(ConnectionInfoResource);
  const connection = connectionInfoResource.getConnectionForNode(payload.pathId);

  const state = useObservableRef(
    () => ({
      query: '',
      loading: true,
      error: new GQLErrorCatcher(),
      get dialect(): SqlDialectInfo | undefined {
        if (!this.connection?.connected) {
          return;
        }

        return this.sqlDialectInfoService.getDialectInfo(createConnectionParam(this.connection));
      },
      async load() {
        this.error.clear();

        try {
          this.query = await sqlGeneratorsResource.generateEntityQuery(payload.generatorId, payload.pathId);
        } catch (exception: any) {
          this.error.catch(exception);
        } finally {
          this.loading = false;
        }
      },
    }),
    {
      query: observable.ref,
      loading: observable.ref,
      connection: observable.ref,
      dialect: computed,
    },
    { connection, sqlDialectInfoService },
  );

  const sqlDialect = useSqlDialectExtension(state.dialect);
  const extensions = useCodemirrorExtensions();
  extensions.set(...sqlDialect);
  const error = useErrorDetails(state.error.exception);

  useEffect(() => {
    state.load();
  }, []);

  useEffect(() => {
    if (!connection) {
      return;
    }

    sqlDialectInfoService.loadSqlDialectInfo(createConnectionParam(connection)).catch(exception => {
      console.error(exception);
      console.warn(`Can't get dialect for connection: '${connection.id}'. Default dialect will be used`);
    });
  });

  return (
    <CommonDialogWrapper size="large">
      <CommonDialogHeader title="app_shared_sql_generators_dialog_title" icon="sql-script" onReject={rejectDialog} />
      <CommonDialogBody noOverflow noBodyPadding>
        <div className={s(styles, { wrapper: true })}>
          <Loader loading={state.loading}>
            {() => <SQLCodeEditorLoader className={s(styles, { sqlCodeEditorLoader: true })} value={state.query} extensions={extensions} readonly />}
          </Loader>
        </div>
      </CommonDialogBody>
      <CommonDialogFooter>
        <div className={s(styles, { footerContainer: true })}>
          {state.error.responseMessage && (
            <ErrorMessage
              className={s(styles, { errorMessage: true })}
              text={state.error.responseMessage}
              hasDetails={error.hasDetails}
              onShowDetails={error.open}
            />
          )}
          <div className={s(styles, { buttons: true })}>
            <Button variant="secondary" onClick={() => copy(state.query, true)}>
              {translate('ui_copy_to_clipboard')}
            </Button>
            <Button onClick={rejectDialog}>{translate('ui_close')}</Button>
          </div>
        </div>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
