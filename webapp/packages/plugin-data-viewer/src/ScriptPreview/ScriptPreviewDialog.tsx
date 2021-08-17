/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import styled, { css } from 'reshadow';

import { Button, useClipboard } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogWrapper, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { SqlDialectInfo } from '@cloudbeaver/core-sdk';
import { SQLCodeEditorLoader, SqlDialectInfoService } from '@cloudbeaver/plugin-sql-editor';

import type { IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseDataResult } from '../DatabaseDataModel/IDatabaseDataResult';

const styles = css`
  CommonDialogWrapper {
    min-height: 400px;
    min-width: 650px;
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
  controls {
    display: flex;
    gap: 24px;
    width: 100%;
  }
  fill {
    flex: 1;
  }
`;

interface Payload {
  script: string;
  model: IDatabaseDataModel<any, IDatabaseDataResult>;
}

export const ScriptPreviewDialog: React.FC<DialogComponentProps<Payload>> = observer(function ScriptPreviewDialog({
  rejectDialog,
  payload,
}) {
  const translate = useTranslate();
  const copy = useClipboard();

  const sqlDialectInfoService = useService(SqlDialectInfoService);

  const [dialect, setDialect] = useState<SqlDialectInfo | null>(null);

  useEffect(() => {
    const connectionId = payload.model.source.executionContext?.context?.connectionId;
    if (!connectionId || dialect) {
      return;
    }

    sqlDialectInfoService.loadSqlDialectInfo(connectionId)
      .then(dialect => {
        if (dialect) {
          setDialect(dialect);
        }
      })
      .catch(exception => {
        console.error(exception);
        console.warn(`Can't get dialect for connection: '${connectionId}'. Default dialect will be used`);
      });
  }, [sqlDialectInfoService, payload.model, dialect]);

  const apply = () => {
    payload.model.source.saveData();
    rejectDialog();
  };

  return styled(styles)(
    <CommonDialogWrapper
      title={translate('data_viewer_script_preview_dialog_title')}
      icon='sql-script'
      footer={(
        <controls>
          <Button mod={['unelevated']} onClick={apply}>{translate('ui_apply')}</Button>
          <fill />
          <Button mod={['outlined']} onClick={() => copy(payload.script, true)}>{translate('ui_copy_to_clipboard')}</Button>
          <Button mod={['unelevated']} onClick={rejectDialog}>{translate('ui_close')}</Button>
        </controls>
      )}
      onReject={rejectDialog}
    >
      <wrapper>
        <SQLCodeEditorLoader
          bindings={{
            autoCursor: false,
          }}
          value={payload.script}
          dialect={dialect || undefined}
          readonly
        />
      </wrapper>
    </CommonDialogWrapper>
  );
});
