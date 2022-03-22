/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';

import { Loader, TextPlaceholder, useMapResource, useObservableRef } from '@cloudbeaver/core-blocks';
import { ConnectionExecutionContextResource, ConnectionExecutionContextService, IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { ScreenComponent } from '@cloudbeaver/core-routing';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
import { ISqlEditorTabState, SqlEditor, SqlEditorService } from '@cloudbeaver/plugin-sql-editor';

import type { ISqlEditorScreenParams } from './ISqlEditorScreenParams';

export const SqlEditorScreen: ScreenComponent<ISqlEditorScreenParams> = observer(function SqlEditorScreen({
  contextId,
}) {
  const translate = useTranslate();
  const connectionExecutionContextResource = useMapResource(
    SqlEditorScreen,
    ConnectionExecutionContextResource,
    CachedMapAllKey
  );
  const sqlEditorService = useService(SqlEditorService);
  const connectionExecutionContextService = useService(ConnectionExecutionContextService);
  const context = connectionExecutionContextService.get(contextId);

  const state = useObservableRef(() => ({
    state: null as null | ISqlEditorTabState,
    setState(contextInfo: IConnectionExecutionContextInfo | undefined) {
      if (contextInfo) {
        this.state = sqlEditorService.getState(0, undefined, undefined, undefined, contextInfo);
      } else {
        this.state = null;
      }
    },
  }), { state: observable }, false);

  if (context?.context?.id !== state.state?.executionContext?.id) {
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
