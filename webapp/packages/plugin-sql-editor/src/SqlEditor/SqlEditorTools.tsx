/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { getComputed, preventFocusHandler, StaticImage, UploadArea, useStyles, useTranslate } from '@cloudbeaver/core-blocks';
import type { ComponentStyle } from '@cloudbeaver/core-theming';

import type { ISqlEditorTabState } from '../ISqlEditorTabState';
import { ESqlDataSourceFeatures } from '../SqlDataSource/ESqlDataSourceFeatures';
import type { ISQLEditorData } from './ISQLEditorData';
import { SqlEditorActionsMenu } from './SqlEditorActionsMenu';
import { useTools } from './useTools';

const styles = css`
  tools {
    width: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    
    &:empty {
      display: none;
    }
  }
`;

interface Props {
  data: ISQLEditorData;
  state: ISqlEditorTabState;
  style?: ComponentStyle;
  className?: string;
}

export const SqlEditorTools = observer<Props>(function SqlEditorTools({
  data,
  state,
  style,
  className,
}) {
  const translate = useTranslate();
  const tools = useTools(state);
  const scriptEmpty = getComputed(() => !data.value.trim());
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
      data.setQuery(script);
    }
  }

  async function downloadScriptHandler() {
    tools.downloadScript(data.value.trim());
  }

  const isScript = data.dataSource?.hasFeature(ESqlDataSourceFeatures.script);

  return styled(useStyles(style, styles))(
    <tools className={className} onMouseDown={preventFocusHandler}>
      <SqlEditorActionsMenu state={state} />
      {isScript && (
        <>
          {!data.readonly && (
            <button
              disabled={disabled}
              title={translate('sql_editor_sql_format_button_tooltip')}
              hidden={isActiveSegmentMode}
              onClick={data.formatScript}
            >
              <StaticImage icon="/icons/sql_format_sm.svg" />
            </button>
          )}
          <button
            disabled={scriptEmpty}
            title={translate('sql_editor_download_script_tooltip')}
            hidden={isActiveSegmentMode}
            onClick={downloadScriptHandler}
          >
            <StaticImage icon='/icons/export.svg' />
          </button>
          {!isActiveSegmentMode && !data.readonly && (
            <UploadArea
              accept='.sql'
              title={translate('sql_editor_upload_script_tooltip')}
              reset
              onChange={handleScriptUpload}
            >
              <upload>
                <StaticImage icon='/icons/import.svg' />
              </upload>
            </UploadArea>
          )}
          {/*<button
              title={translate('sql_editor_sql_execution_script_lock_tooltip')}
              hidden={data.dataSource?.isReadonly() ?? true}
              onClick={data.switchEditing}
            >
              <StaticImage icon={data.editing ? '/icons/sql_unlock_sm.svg' : '/icons/sql_lock_sm.svg'} />
            </button>*/}
        </>
      )}
    </tools>
  );
});