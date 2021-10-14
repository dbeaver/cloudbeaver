/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useMemo } from 'react';
import styled from 'reshadow';

import { useClipboard, Button, Iframe } from '@cloudbeaver/core-blocks';
import { CommonDialogWrapper, DialogComponent } from '@cloudbeaver/core-dialogs';
import { useStyles } from '@cloudbeaver/core-theming';

import { ErrorModel, IErrorInfo } from './ErrorModel';
import { dialogStyle, styles } from './styles';

function DisplayErrorInfo({ error }: {error: IErrorInfo}) {
  return styled(useStyles(styles))(
    <>
      <property>
        <message>
          {error.message}
        </message>
      </property>
      {error.stackTrace && (
        <property>
          <textarea readOnly>{error.stackTrace}</textarea>
        </property>
      )}
    </>
  );
}

export const ErrorDetailsDialog: DialogComponent<Error | string, null> = observer(function ErrorDetailsDialog(props) {
  const error = useMemo(
    () => (props.payload instanceof Error
      ? new ErrorModel({ error: props.payload })
      : new ErrorModel({ reason: props.payload })),
    [props.payload]
  );

  const copy = useClipboard();
  const copyHandler = useCallback(
    () => copy(error.textToCopy, true),
    []
  );

  return styled(useStyles(styles))(
    <CommonDialogWrapper
      size='large'
      title="core_eventsLog_dbeaverErrorDetails"
      icon='/icons/error_icon.svg'
      footer={(
        <>
          {error.textToCopy && (
            <Button type="button" mod={['outlined']} onClick={copyHandler}>Copy</Button>
          )}
          <Button type="button" mod={['unelevated']} onClick={props.rejectDialog}>Close</Button>
        </>
      )}
      style={dialogStyle}
      bigIcon
      onReject={props.rejectDialog}
    >
      {error.reason && <property>{error.reason}</property>}
      {error.htmlBody && <Iframe srcDoc={error.htmlBody} />}
      {error.errors.map(
        (error, id) => (
          <>
            {id > 0 && <hr />}
            <DisplayErrorInfo key={id} error={error} />
          </>
        )
      )}
    </CommonDialogWrapper>
  );
}
);
