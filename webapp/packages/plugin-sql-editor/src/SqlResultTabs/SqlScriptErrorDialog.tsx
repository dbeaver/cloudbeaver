/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  ErrorMessage,
  Fill,
  useErrorDetails,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';

interface ISqlScriptErrorDialogPayload {
  query: string;
  error: Error;
}

export type SqlScriptErrorAction = 'stop' | 'retry' | 'skip' | 'skip-all';

export const SqlScriptErrorDialog: DialogComponent<ISqlScriptErrorDialogPayload, SqlScriptErrorAction> = function SqlScriptErrorDialog({
  payload,
  resolveDialog,
  rejectDialog,
}) {
  const translate = useTranslate();
  const errorDetails = useErrorDetails(payload.error);

  return (
    <CommonDialogWrapper size="large" fixedWidth>
      <CommonDialogHeader title="sql_editor_script_error_title" onReject={rejectDialog} />
      <CommonDialogBody>
        <p>{translate('sql_editor_script_error_message')}</p>
        <pre className="tw:whitespace-pre-wrap tw:break-words">{payload.query}</pre>
        <ErrorMessage text={payload.error.message} hasDetails={errorDetails.hasDetails} onShowDetails={errorDetails.open} />
      </CommonDialogBody>
      <CommonDialogFooter className="tw:gap-2 tw:flex-wrap">
        <Button type="button" variant="secondary" onClick={() => rejectDialog()}>
          {translate('ui_processing_stop')}
        </Button>
        <Fill />
        <Button type="button" variant="secondary" onClick={() => resolveDialog('retry')}>
          {translate('ui_processing_retry')}
        </Button>
        <Button type="button" onClick={() => resolveDialog('skip')}>
          {translate('ui_processing_skip')}
        </Button>
        <Button type="button" variant="secondary" onClick={() => resolveDialog('skip-all')}>
          {translate('sql_editor_script_error_skip_all')}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
};
