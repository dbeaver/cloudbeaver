/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Button, useClipboard, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { ConnectionDialectResource, ConnectionExecutionContextService, createConnectionParam } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogBody, CommonDialogFooter, CommonDialogHeader, CommonDialogWrapper, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import type { IDatabaseDataModel } from '@cloudbeaver/plugin-data-viewer';

import { SQLCodeEditorLoader } from '../SqlEditor/SQLCodeEditor/SQLCodeEditorLoader';

const styles = css`
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
  fill {
    flex: 1;
  }
  CommonDialogFooter {
    gap: 24px;
  }
`;

interface Payload {
  script: string;
  model: IDatabaseDataModel;
}

export const ScriptPreviewDialog = observer<DialogComponentProps<Payload>>(function ScriptPreviewDialog({
  rejectDialog,
  payload,
}) {
  const translate = useTranslate();
  const copy = useClipboard();

  const connectionExecutionContextService = useService(ConnectionExecutionContextService);
  const context = connectionExecutionContextService.get(payload.model.source.executionContext?.context?.id ?? '');
  const contextInfo = context?.context;
  const dialect = useResource(ScriptPreviewDialog, ConnectionDialectResource, contextInfo
    ? createConnectionParam(contextInfo.projectId, contextInfo.connectionId)
    : null
  );

  const apply = async () => {
    await payload.model.save();
    rejectDialog();
  };

  return styled(styles)(
    <CommonDialogWrapper size='large'>
      <CommonDialogHeader
        title="data_viewer_script_preview_dialog_title"
        icon='sql-script'
        onReject={rejectDialog}
      />
      <CommonDialogBody noBodyPadding noOverflow>
        <wrapper>
          <SQLCodeEditorLoader
            bindings={{
              autoCursor: false,
            }}
            value={payload.script}
            dialect={dialect.data}
            readonly
          />
        </wrapper>
      </CommonDialogBody>
      <CommonDialogFooter>
        <Button mod={['unelevated']} onClick={apply}>{translate('ui_apply')}</Button>
        <fill />
        <Button mod={['outlined']} onClick={() => copy(payload.script, true)}>{translate('ui_copy_to_clipboard')}</Button>
        <Button mod={['unelevated']} onClick={rejectDialog}>{translate('ui_close')}</Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
