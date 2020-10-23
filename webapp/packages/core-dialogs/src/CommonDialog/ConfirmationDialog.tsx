/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { Icon, Button } from '@cloudbeaver/core-blocks';
import { Translate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { commonDialogStyle } from './CommonDialog/styles';
import { DialogComponent } from './CommonDialogService';

const style = css`
  footer {
    align-items: center;
    justify-content: flex-end;
  }

  fill {
    flex: 1;
  }
`;

export interface ConfirmationDialogPayload {
  title: string;
  message: string;
  confirmActionText?: string;
}

export const ConfirmationDialog: DialogComponent<ConfirmationDialogPayload> = function ConfirmationDialog({
  payload,
  resolveDialog,
  rejectDialog,
  className,
}) {
  return styled(useStyles(commonDialogStyle, style))(
    <dialog className={className}>
      <header>
        <header-title as="div">
          <h1><Translate token={payload.title} /></h1>
          <reject as="div">
            <Icon name="cross" viewBox="0 0 16 16" onClick={rejectDialog} />
          </reject>
        </header-title>
      </header>
      <dialog-body as="div"><Translate token={payload.message} /></dialog-body>
      <footer>
        <Button
          type="button"
          mod={['outlined']}
          onClick={rejectDialog}
        >
          <Translate token='ui_processing_cancel' />
        </Button>
        <fill as="div" />
        <Button
          type="button"
          mod={['unelevated']}
          onClick={() => resolveDialog()}
        >
          <Translate token={payload.confirmActionText || 'ui_processing_ok'} />
        </Button>
      </footer>
    </dialog>
  );
};
