/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import { Loader, TextPlaceholder, useObservableRef, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import {
  ConnectionExecutionContextResource,
  ConnectionExecutionContextService,
  type IConnectionExecutionContextInfo,
} from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import type { ScreenComponent } from '@cloudbeaver/core-routing';
import { uuid } from '@cloudbeaver/core-utils';
import {
  type ISqlEditorTabState,
  MemorySqlDataSource,
  requestSqlEditorFocus,
  SqlDataSourceService,
  SqlEditor,
  SqlEditorModelService,
  SqlEditorService,
} from '@cloudbeaver/plugin-sql-editor';

import type { ISqlEditorScreenParams } from './ISqlEditorScreenParams.js';

export const SqlEditorScreen: ScreenComponent<ISqlEditorScreenParams> = observer(function SqlEditorScreen({ contextId }) {
  const translate = useTranslate();
  const connectionExecutionContextResource = useResource(SqlEditorScreen, ConnectionExecutionContextResource, CachedMapAllKey);
  const sqlDataSourceService = useService(SqlDataSourceService);
  const sqlEditorService = useService(SqlEditorService);
  const sqlEditorModelService = useService(SqlEditorModelService);
  const connectionExecutionContextService = useService(ConnectionExecutionContextService);
  const context = connectionExecutionContextService.get(contextId);

  const state = useObservableRef(
    () => ({
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

          this.state = sqlEditorService.getState(editorId, MemorySqlDataSource.key, 0, undefined);

          sqlDataSourceService.create(this.state, MemorySqlDataSource.key, { script: '', executionContext: contextInfo });
        } else {
          this.state = null;
        }
      },
    }),
    { state: observable },
    false,
  );

  if (context?.context?.id !== state.dataSource?.executionContext?.id) {
    state.setState(context?.context);
  }

  const editorState = state.state;

  useEffect(() => {
    if (!editorState) {
      return;
    }

    const model = sqlEditorModelService.getOrCreate(editorState);
    requestSqlEditorFocus(model, () => state.state === editorState);
    const request = model.focusRequest;

    return () => {
      if (request) {
        model.completeFocusRequest(request);
      }
    };
  }, [editorState, sqlEditorModelService, state]);

  return (
    <Loader state={[connectionExecutionContextResource]}>
      {state.state ? <SqlEditor state={state.state} /> : <TextPlaceholder>{translate('sql_editor_screen_context_not_found')}</TextPlaceholder>}
    </Loader>
  );
});
