/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { DialogComponent, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';

import { Button } from '../Button';
import { Fill } from '../Fill';
import { Translate } from '../localization/Translate';
import { s } from '../s';
import { useS } from '../useS';
import { CommonDialogBody } from './CommonDialog/CommonDialogBody';
import { CommonDialogFooter } from './CommonDialog/CommonDialogFooter';
import { CommonDialogHeader } from './CommonDialog/CommonDialogHeader';
import { CommonDialogWrapper } from './CommonDialog/CommonDialogWrapper';
import style from './ConfirmationDialog.m.css';

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
  const styles = useS(style);
  const { icon, title, subTitle, bigIcon, viewBox, message, confirmActionText, cancelActionText } = payload;

  return (
    <CommonDialogWrapper size="small" className={className} fixedWidth>
      <CommonDialogHeader title={title} subTitle={subTitle} icon={icon} viewBox={viewBox} bigIcon={bigIcon} onReject={rejectDialog} />
      <CommonDialogBody>
        <Translate token={message} />
      </CommonDialogBody>
      <CommonDialogFooter className={s(styles, { footer: true })}>
        <Button type="button" mod={['outlined']} onClick={rejectDialog}>
          <Translate token={cancelActionText || 'ui_processing_cancel'} />
        </Button>
        <Fill />
        {payload.extraStatus !== undefined && (
          <Button type="button" mod={['outlined']} onClick={() => resolveDialog(payload.extraStatus)}>
            <Translate token={cancelActionText || 'ui_no'} />
          </Button>
        )}
        <Button type="button" mod={['unelevated']} onClick={() => resolveDialog()}>
          <Translate token={confirmActionText || 'ui_processing_ok'} />
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
};
