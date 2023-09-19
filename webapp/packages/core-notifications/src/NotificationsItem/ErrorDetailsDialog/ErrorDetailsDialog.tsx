/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo } from 'react';

import { Button, Iframe, s, Textarea, useClipboard, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { CommonDialogBody, CommonDialogFooter, CommonDialogHeader, CommonDialogWrapper, DialogComponent } from '@cloudbeaver/core-dialogs';

import style from './ErrorDetailsDialog.m.css';
import { ErrorModel, IErrorInfo } from './ErrorModel';

function DisplayErrorInfo({ error }: { error: IErrorInfo }) {
  const styles = useS(style);

  return (
    <>
      <property className={s(styles, { property: true })}>
        {error.isHtml ? <Iframe srcDoc={error.message} /> : <message className={s(styles, { message: true })}>{error.message}</message>}
      </property>
      {error.stackTrace && (
        <property className={s(styles, { property: true })}>
          <Textarea className={s(styles, { textarea: true })} value={error.stackTrace} readOnly embedded />
        </property>
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
          <Button type="button" mod={['outlined']} onClick={copyHandler}>
            {translate('ui_copy_to_clipboard')}
          </Button>
        )}
        <Button type="button" mod={['unelevated']} onClick={props.rejectDialog}>
          {translate('ui_close')}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
