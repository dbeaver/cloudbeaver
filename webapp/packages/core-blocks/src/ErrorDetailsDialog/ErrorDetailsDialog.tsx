/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo } from 'react';

import type { DialogComponent } from '@cloudbeaver/core-dialogs';

import { Button } from '../Button.js';
import { CommonDialogBody } from '../CommonDialog/CommonDialog/CommonDialogBody.js';
import { CommonDialogFooter } from '../CommonDialog/CommonDialog/CommonDialogFooter.js';
import { CommonDialogHeader } from '../CommonDialog/CommonDialog/CommonDialogHeader.js';
import { CommonDialogWrapper } from '../CommonDialog/CommonDialog/CommonDialogWrapper.js';
import { Textarea } from '../FormControls/Textarea.js';
import { Iframe } from '../Iframe.js';
import { useTranslate } from '../localization/useTranslate.js';
import { s } from '../s.js';
import { useClipboard } from '../useClipboard.js';
import { useS } from '../useS.js';
import style from './ErrorDetailsDialog.module.css';
import { ErrorModel, type IErrorInfo } from './ErrorModel.js';

function DisplayErrorInfo({ error }: { error: IErrorInfo }) {
  const styles = useS(style);
  const translate = useTranslate();

  return (
    <>
      <div className={s(styles, { property: true })}>
        {error.isHtml ? <Iframe srcDoc={error.message} /> : <div className={s(styles, { message: true })}>{translate(error.message)}</div>}
      </div>
      {error.stackTrace && (
        <div className={s(styles, { property: true })}>
          <Textarea className={s(styles, { textarea: true })} value={error.stackTrace} readOnly embedded />
        </div>
      )}
    </>
  );
}

export const ErrorDetailsDialog: DialogComponent<Error | string, null> = observer(function ErrorDetailsDialog(props) {
  const translate = useTranslate();
  const styles = useS(style);

  const error = useMemo(() => new ErrorModel({ error: props.payload }), [props.payload]);

  const copy = useClipboard();
  const copyHandler = useCallback(() => copy(error.textToCopy, true), [error, copy]);

  return (
    <CommonDialogWrapper size="large">
      <CommonDialogHeader title="core_eventsLog_dbeaverErrorDetails" icon="/icons/error_icon.svg" bigIcon onReject={props.rejectDialog} />
      <CommonDialogBody>
        {error.errors.map((error, id) => (
          <div key={id} className={s(styles, { errorInfoContainer: true })}>
            {id > 0 && <hr />}
            <DisplayErrorInfo error={error} />
          </div>
        ))}
      </CommonDialogBody>
      <CommonDialogFooter className={s(styles, { footer: true })}>
        {error.textToCopy && (
          <Button type="button" variant="secondary" onClick={copyHandler}>
            {translate('ui_copy_to_clipboard')}
          </Button>
        )}
        <Button type="button" onClick={props.rejectDialog}>
          {translate('ui_close')}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
