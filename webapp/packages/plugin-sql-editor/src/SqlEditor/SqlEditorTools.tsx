/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ActionIconButton, getComputed, preventFocusHandler, s, UploadArea, useS, useTranslate } from '@cloudbeaver/core-blocks';

import type { ISqlEditorTabState } from '../ISqlEditorTabState.js';
import { ESqlDataSourceFeatures } from '../SqlDataSource/ESqlDataSourceFeatures.js';
import type { ISQLEditorData } from './ISQLEditorData.js';
import style from './SqlEditorTools.module.css';
import { SqlEditorToolsMenu } from './SqlEditorToolsMenu.js';
import { useTools } from './useTools.js';

interface Props {
  data: ISQLEditorData;
  state: ISqlEditorTabState;
  className?: string;
}

export const SqlEditorTools = observer<Props>(function SqlEditorTools({ data, state, className }) {
  const translate = useTranslate();
  const styles = useS(style);
  const tools = useTools(state);
  const scriptEmpty = getComputed(() => data.value.length === 0);
  const disabled = getComputed(() => data.isDisabled || data.isScriptEmpty);
  const isActiveSegmentMode = getComputed(() => data.activeSegmentMode.activeSegmentMode);

  async function handleScriptUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      throw new Error('File is not found');
    }

    const prevScript = data.value.trim();
    const script = await tools.tryReadScript(file, prevScript);

    if (script) {
      data.setScript(script);
    }
  }

  async function downloadScriptHandler() {
    tools.downloadScript(data.value.trim());
  }

  const isScript = data.dataSource?.hasFeature(ESqlDataSourceFeatures.script);

  return (
    <div className={s(styles, { tools: true }, className)} onMouseDown={preventFocusHandler}>
      <SqlEditorToolsMenu state={state} data={data} />
      {isScript && (
        <>
          <ActionIconButton
            name="/icons/sql_format_sm.svg"
            disabled={disabled || data.readonly}
            title={translate('sql_editor_sql_format_button_tooltip')}
            hidden={isActiveSegmentMode}
            img
            onClick={data.formatScript}
          />
          <ActionIconButton
            name="/icons/export.svg"
            disabled={scriptEmpty}
            title={translate('sql_editor_download_script_tooltip')}
            hidden={isActiveSegmentMode}
            img
            onClick={downloadScriptHandler}
          />
          {!isActiveSegmentMode && (
            <UploadArea
              accept=".sql"
              title={translate('sql_editor_upload_script_tooltip')}
              disabled={data.readonly}
              reset
              onChange={handleScriptUpload}
            >
              <ActionIconButton tag="div" name="/icons/import.svg" disabled={data.readonly} img />
            </UploadArea>
          )}
        </>
      )}
    </div>
  );
});
