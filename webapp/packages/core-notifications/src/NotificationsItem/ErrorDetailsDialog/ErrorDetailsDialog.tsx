/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback, useMemo } from 'react';
import styled from 'reshadow';

import { useClipboard, Button, SanitizedHTML } from '@cloudbeaver/core-blocks';
import { CommonDialogWrapper, DialogComponent, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { ErrorModel, IErrorInfo } from './ErrorModel';
import { styles } from './styles';

function DisplayErrorInfo({ error }: {error: IErrorInfo}) {
  return styled(useStyles(styles))(
    <>
      <property as="div">
        <message as="div">
          {error.message}
        </message>
      </property>
      {error.stackTrace && (
        <property as="div">
          <textarea readOnly>{error.stackTrace}</textarea>
        </property>
      )}
    </>
  );
}

export const ErrorDetailsDialog: DialogComponent<Error | string, null> = observer(
  function ErrorDetailsDialog(props: DialogComponentProps<Error | string, null>) {
    const error = useMemo(
      () => (props.payload instanceof Error
        ? new ErrorModel({ error: props.payload })
        : new ErrorModel({ reason: props.payload })),
      [props.payload]
    );

    const title = useTranslate('core_eventsLog_dbeaverErrorDetails');

    const [copy] = useClipboard();
    const copyHandler = useCallback(
      () => copy(error.textToCopy),
      []
    );

    return styled(useStyles(styles))(
      <CommonDialogWrapper
        title={title}
        footer={(
          <controls as="div">
            <Button type="button" mod={['unelevated']} onClick={props.rejectDialog}>Close</Button>
            {error.textToCopy && (
              <Button type="button" mod={['outlined']} onClick={copyHandler}>Copy</Button>
            )}
          </controls>
        )}
        onReject={props.rejectDialog}
      >
        {error.reason && <property as="div">{error.reason}</property>}
        {error.htmlBody && (<SanitizedHTML html={error.htmlBody}/>)}
        {error.errors.map(
          (error, id) => (
            <>
              {id > 0 && <hr/>}
              <DisplayErrorInfo key={id} error={error}/>
            </>
          )
        )}
      </CommonDialogWrapper>
    );
  }
);
