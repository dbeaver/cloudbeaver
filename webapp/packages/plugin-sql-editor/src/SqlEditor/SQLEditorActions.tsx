/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ActionIconButton, getComputed, preventFocusHandler, s, useS, useTranslate } from '@cloudbeaver/core-blocks';

import type { ISqlEditorTabState } from '../ISqlEditorTabState.js';
import { ESqlDataSourceFeatures } from '../SqlDataSource/ESqlDataSourceFeatures.js';
import type { ISQLEditorData } from './ISQLEditorData.js';
import style from './SQLEditorActions.module.css';
import { SqlEditorActionsMenu } from './SqlEditorActionsMenu.js';
import { SqlEditorTools } from './SqlEditorTools.js';

interface Props {
  data: ISQLEditorData;
  state: ISqlEditorTabState;
  className?: string;
}

export const SQLEditorActions = observer<Props>(function SQLEditorActions({ data, state }) {
  const styles = useS(style);
  const translate = useTranslate();
  const isActiveSegmentMode = getComputed(() => data.activeSegmentMode.activeSegmentMode);
  const disabled = getComputed(() => data.isScriptEmpty || data.isDisabled);
  const isQuery = data.dataSource?.hasFeature(ESqlDataSourceFeatures.query);
  const isExecutable = data.dataSource?.hasFeature(ESqlDataSourceFeatures.executable);

  return (
    <div className={s(styles, { container: true })}>
      <div className={s(styles, { actions: true })} onMouseDown={preventFocusHandler}>
        {isExecutable && (
          <>
            {isQuery && (
              <>
                <ActionIconButton
                  name="/icons/sql_exec.svg"
                  disabled={disabled}
                  title={translate('sql_editor_sql_execution_button_tooltip')}
                  img
                  onClick={data.executeQuery}
                />
                <ActionIconButton
                  name="/icons/sql_exec_new.svg"
                  disabled={disabled}
                  title={translate('sql_editor_sql_execution_new_tab_button_tooltip')}
                  img
                  onClick={data.executeQueryNewTab}
                />
              </>
            )}
            <ActionIconButton
              name="/icons/sql_script_exec.svg"
              disabled={disabled}
              hidden={isActiveSegmentMode}
              title={translate('sql_editor_sql_execution_script_button_tooltip')}
              img
              onClick={data.executeScript}
            />
            {isQuery && data.dialect?.supportsExplainExecutionPlan && (
              <ActionIconButton
                name="/icons/sql_execution_plan.svg"
                disabled={disabled}
                hidden={isActiveSegmentMode}
                title={translate('sql_editor_execution_plan_button_tooltip')}
                img
                onClick={data.showExecutionPlan}
              />
            )}
          </>
        )}
        <SqlEditorActionsMenu state={state} />
      </div>
      <SqlEditorTools data={data} state={state} />
    </div>
  );
});
