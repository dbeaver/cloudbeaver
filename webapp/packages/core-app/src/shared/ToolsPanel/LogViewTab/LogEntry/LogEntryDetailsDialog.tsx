/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { CommonDialogWrapper, DialogComponent, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useStyles } from '@cloudbeaver/core-theming';

import { ILogEntry } from '../ILogEntry';

const styles = css`
  message {
    width: 700px;
    max-height: 80px;
    margin-bottom: 18px;
    overflow: auto;
  }
  textarea {
    width: 100% !important;
    min-height: 240px;
    box-sizing: border-box;
  }
`;

export const LogEntryDetailsDialog: DialogComponent<ILogEntry, null> = observer(
  function LogEntryDetailsDialog(props: DialogComponentProps<ILogEntry, null>) {

    return styled(useStyles(styles))(
      <CommonDialogWrapper
        title={`${props.payload.type} ${props.payload.time}`}
        onReject={props.rejectDialog}
      >
        <message as="div">
          {props.payload.message}
        </message>
        <textarea value={props.payload.stackTrace} readOnly/>
      </CommonDialogWrapper>
    );
  }
);
