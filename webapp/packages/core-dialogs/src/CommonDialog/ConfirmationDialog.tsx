/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { Button } from '@cloudbeaver/core-blocks';
import { TLocalizationToken, Translate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { CommonDialogWrapper } from './CommonDialog/CommonDialogWrapper';
import type { DialogComponent, DialogueStateResult } from './CommonDialogService';

const style = css`
  footer {
    align-items: center;
    gap: 16px;
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
  message: TLocalizationToken;
  confirmActionText?: TLocalizationToken;
  cancelActionText?: TLocalizationToken;
  extraActionText?: TLocalizationToken;
  extraStatus?: string;
}

export const ConfirmationDialog: DialogComponent<ConfirmationDialogPayload, DialogueStateResult | string> = function ConfirmationDialog({
  payload,
  resolveDialog,
  rejectDialog,
  className,
}) {
  const { icon, title, subTitle, bigIcon, viewBox, message, confirmActionText, cancelActionText } = payload;

  return styled(useStyles(style))(
    <CommonDialogWrapper
      size='small'
      subTitle={subTitle}
      title={title}
      icon={icon}
      viewBox={viewBox}
      bigIcon={bigIcon}
      className={className}
      style={style}
      footer={(
        <>
          <Button
            type="button"
            mod={['outlined']}
            onClick={rejectDialog}
          >
            <Translate token={cancelActionText || 'ui_processing_cancel'} />
          </Button>
          <fill />
          {payload.extraStatus !== undefined && (
            <Button
              type="button"
              mod={['outlined']}
              onClick={() => resolveDialog(payload.extraStatus)}
            >
              <Translate token={cancelActionText || 'ui_no'} />
            </Button>
          )}
          <Button
            type="button"
            mod={['unelevated']}
            onClick={() => resolveDialog()}
          >
            <Translate token={confirmActionText || 'ui_processing_ok'} />
          </Button>
        </>
      )}
      fixedWidth
      onReject={rejectDialog}
    >
      <Translate token={message} />
    </CommonDialogWrapper>
  );
};
