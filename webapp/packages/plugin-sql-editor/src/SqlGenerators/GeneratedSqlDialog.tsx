/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import styled, { css } from 'reshadow';

import { Button, ErrorMessage, Loader, useClipboard, useErrorDetails, useObservableRef } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogWrapper, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { GQLErrorCatcher, SqlDialectInfo } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';
import { SQLCodeEditorLoader, SqlDialectInfoService } from '@cloudbeaver/plugin-sql-editor';

import { SqlGeneratorsResource } from './SqlGeneratorsResource';

const styles = css`
    footer-container {
      display: flex;
      width: min-content;
      flex: 1;
      align-items: center;
      justify-content: flex-end;
      gap: 24px;
    }
    buttons {
      flex: 0 0 auto;
      display: flex;
      gap: 24px;
    }
    ErrorMessage {
      composes: theme-background-secondary theme-text-on-secondary from global;
      flex: 1;
    }
    wrapper {
      display: flex;
      align-items: center;
      height: 100%;
      width: 100%;
      overflow: auto;
    }
    SQLCodeEditorLoader {
      height: 100%;
      width: 100%;
    }
`;

interface Payload {
  generatorId: string;
  pathId: string;
}

export const GeneratedSqlDialog = observer<DialogComponentProps<Payload>>(function GeneratedSqlDialog({
  rejectDialog,
  payload,
}) {
  const style = useStyles(styles);
  const translate = useTranslate();
  const copy = useClipboard();

  const sqlDialectInfoService = useService(SqlDialectInfoService);
  const sqlGeneratorsResource = useService(SqlGeneratorsResource);
  const connectionInfoResource = useService(ConnectionInfoResource);
  const connection = connectionInfoResource.getConnectionForNode(payload.pathId);

  const state = useObservableRef(() => ({
    query: '',
    loading: true,
    error: new GQLErrorCatcher(),
    get dialect(): SqlDialectInfo | undefined {
      if (!this.connection?.connected) {
        return;
      }

      return this.sqlDialectInfoService.getDialectInfo(this.connection.id);
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
  }), {
    query: observable.ref,
    loading: observable.ref,
    connection: observable.ref,
    dialect: computed,
  }, { connection, sqlDialectInfoService });

  const error = useErrorDetails(state.error.exception);

  useEffect(() => {
    state.load();
  }, []);

  useEffect(() => {
    if (!connection) {
      return;
    }

    sqlDialectInfoService.loadSqlDialectInfo(connection.id)
      .catch(exception => {
        console.error(exception);
        console.warn(`Can't get dialect for connection: '${connection.id}'. Default dialect will be used`);
      });
  });

  return styled(style)(
    <CommonDialogWrapper
      size='large'
      title='app_shared_sql_generators_dialog_title'
      icon='sql-script'
      footer={(
        <footer-container>
          {state.error.responseMessage && (
            <ErrorMessage
              text={state.error.responseMessage}
              hasDetails={error.details?.hasDetails}
              onShowDetails={error.open}
            />
          )}
          <buttons>
            <Button mod={['outlined']} onClick={() => copy(state.query, true)}>{translate('ui_copy_to_clipboard')}</Button>
            <Button mod={['unelevated']} onClick={rejectDialog}>{translate('ui_close')}</Button>
          </buttons>
        </footer-container>
      )}
      noBodyPadding
      noOverflow
      onReject={rejectDialog}
    >
      <wrapper>
        <Loader loading={state.loading}>
          {() => styled(style)(
            <SQLCodeEditorLoader
              bindings={{
                autoCursor: false,
              }}
              value={state.query}
              dialect={state.dialect}
              readonly
            />
          )}
        </Loader>
      </wrapper>
    </CommonDialogWrapper>
  );
});
