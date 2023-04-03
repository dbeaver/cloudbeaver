/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';

import { Loader, TextPlaceholder, useResource, useObservableRef, useTranslate } from '@cloudbeaver/core-blocks';
import { ConnectionExecutionContextResource, ConnectionExecutionContextService, IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import type { ScreenComponent } from '@cloudbeaver/core-routing';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';
import { ISqlEditorTabState, MemorySqlDataSource, SqlDataSourceService, SqlEditor, SqlEditorService } from '@cloudbeaver/plugin-sql-editor';

import type { ISqlEditorScreenParams } from './ISqlEditorScreenParams';

export const SqlEditorScreen: ScreenComponent<ISqlEditorScreenParams> = observer(function SqlEditorScreen({
  contextId,
}) {
  const translate = useTranslate();
  const connectionExecutionContextResource = useResource(
    SqlEditorScreen,
    ConnectionExecutionContextResource,
    CachedMapAllKey
  );
  const sqlDataSourceService = useService(SqlDataSourceService);
  const sqlEditorService = useService(SqlEditorService);
  const connectionExecutionContextService = useService(ConnectionExecutionContextService);
  const context = connectionExecutionContextService.get(contextId);

  const state = useObservableRef(() => ({
    get dataSource() {
      if (!this.state) {
        return undefined;
      }

      return sqlDataSourceService.get(this.state.editorId);
    },
    state: null as null | ISqlEditorTabState,
    setState(contextInfo: IConnectionExecutionContextInfo | undefined) {
      if (contextInfo) {
        const editorId = uuid();


        this.state = sqlEditorService.getState(
          editorId,
          MemorySqlDataSource.key,
          0,
          undefined,
        );

        sqlDataSourceService.create(this.state, MemorySqlDataSource.key, { script: '', executionContext:contextInfo });

      } else {
        this.state = null;
      }
    },
  }), { state: observable }, false);

  if (context?.context?.id !== state.dataSource?.executionContext?.id) {
    state.setState(context?.context);
  }

  return (
    <Loader state={[connectionExecutionContextResource]}>
      {state.state
        ? <SqlEditor state={state.state} />
        : <TextPlaceholder>{translate('sql_editor_screen_context_not_found')}</TextPlaceholder>}
    </Loader>
  );
});
