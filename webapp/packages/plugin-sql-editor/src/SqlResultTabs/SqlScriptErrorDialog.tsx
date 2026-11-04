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
  Fill,
  IconOrImage,
  s,
  useErrorDetails,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';

import styles from './SqlScriptErrorDialog.module.css';

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
  const style = useS(styles);

  return (
    <CommonDialogWrapper size="large" fixedWidth freeHeight>
      <CommonDialogHeader title="sql_editor_script_error_title" onReject={rejectDialog} />
      <CommonDialogBody>
        <p>{translate('sql_editor_script_error_message')}</p>
        <pre className={s(style, { query: true })}>{payload.query}</pre>
        <div role="status" tabIndex={0} aria-label={payload.error.message} className={s(style, { message: true })}>
          <IconOrImage className={s(style, { errorIcon: true })} icon="/icons/preload/error_icon_sm.svg" />
          <div className={s(style, { messageBody: true })}>{payload.error.message}</div>
          {errorDetails.hasDetails && (
            <Button type="button" variant="secondary" onClick={errorDetails.open}>
              {translate('ui_errors_details')}
            </Button>
          )}
        </div>
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
