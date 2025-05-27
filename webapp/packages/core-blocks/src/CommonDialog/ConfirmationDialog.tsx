/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { DialogComponent, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';

import { Button } from '../Button.js';
import { Fill } from '../Fill.js';
import { Translate } from '../localization/Translate.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import { CommonDialogBody } from './CommonDialog/CommonDialogBody.js';
import { CommonDialogFooter } from './CommonDialog/CommonDialogFooter.js';
import { CommonDialogHeader } from './CommonDialog/CommonDialogHeader.js';
import { CommonDialogWrapper, type CommonDialogWrapperSize } from './CommonDialog/CommonDialogWrapper.js';
import style from './ConfirmationDialog.module.css';

export interface ConfirmationDialogPayload {
  icon?: string;
  size?: CommonDialogWrapperSize;
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
  const styles = useS(style);
  const { icon, title, subTitle, size = 'small', bigIcon, viewBox, message, confirmActionText, cancelActionText } = payload;

  return (
    <CommonDialogWrapper size={size} className={className} fixedWidth>
      <CommonDialogHeader title={title} subTitle={subTitle} icon={icon} viewBox={viewBox} bigIcon={bigIcon} onReject={rejectDialog} />
      <CommonDialogBody>
        <Translate token={message} />
      </CommonDialogBody>
      <CommonDialogFooter className={s(styles, { footer: true })}>
        <Button type="button" variant="secondary" onClick={rejectDialog}>
          <Translate token={cancelActionText || 'ui_processing_cancel'} />
        </Button>
        <Fill />
        {payload.extraStatus !== undefined && (
          <Button type="button" variant="secondary" onClick={() => resolveDialog(payload.extraStatus)}>
            <Translate token={cancelActionText || 'ui_no'} />
          </Button>
        )}
        <Button type="button" onClick={() => resolveDialog()}>
          <Translate token={confirmActionText || 'ui_processing_ok'} />
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
};
