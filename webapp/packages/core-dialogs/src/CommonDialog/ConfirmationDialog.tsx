/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css, use } from 'reshadow';

import { Icon, Button, IconOrImage } from '@cloudbeaver/core-blocks';
import { Translate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { commonDialogThemeStyle, commonDialogBaseStyle } from './CommonDialog/styles';
import type { DialogComponent } from './CommonDialogService';

const style = css`
  dialog {
    width: 400px;
    min-width: auto;
  }

  footer {
    align-items: center;
    justify-content: flex-end;
  }

  fill {
    flex: 1;
  }
`;

export interface ConfirmationDialogPayload {
  icon?: string;
  title: string;
  subTitle?: string;
  bigIcon?: boolean;
  viewBox?: string;
  message: string;
  confirmActionText?: string;
}

export const ConfirmationDialog: DialogComponent<ConfirmationDialogPayload> = function ConfirmationDialog({
  payload,
  resolveDialog,
  rejectDialog,
  className,
}) {
  const { icon, title, subTitle, bigIcon, viewBox, message, confirmActionText } = payload;

  return styled(useStyles(commonDialogThemeStyle, commonDialogBaseStyle, style))(
    <dialog className={className}>
      <header>
        <icon-container>
          {icon && <IconOrImage {...use({ bigIcon })} icon={icon} viewBox={viewBox} />}
        </icon-container>
        <header-title>
          <h3><Translate token={title} /></h3>
          {rejectDialog && (
            <reject>
              <Icon name="cross" viewBox="0 0 16 16" onClick={rejectDialog} />
            </reject>
          )}
        </header-title>
        {subTitle && <sub-title>{subTitle}</sub-title>}
      </header>
      <dialog-body>
        <dialog-body-content>
          <Translate token={message} />
        </dialog-body-content>
        <dialog-body-overflow />
      </dialog-body>
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
          <Translate token={confirmActionText || 'ui_processing_ok'} />
        </Button>
      </footer>
    </dialog>
  );
};
