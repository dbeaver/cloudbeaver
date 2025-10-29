/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
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
import { Checkbox } from '../FormControls/Checkboxes/Checkbox.js';
import { useTranslate } from '../localization/useTranslate.js';
import { useState } from 'react';

export interface ConfirmationDialogPayload {
  icon?: string;
  size?: CommonDialogWrapperSize;
  title: string;
  children?: () => React.ReactElement;
  subTitle?: string;
  showSkipConfirmations?: boolean;
  showExtraAction?: boolean;
  bigIcon?: boolean;
  viewBox?: string;
  message: TLocalizationToken;
  confirmActionText?: TLocalizationToken;
  cancelActionText?: TLocalizationToken;
  extraActionText?: TLocalizationToken;
}

export interface ConfirmationDialogResult {
  isExtraAction?: boolean;
  skipConfirmations: boolean;
}

export const ConfirmationDialog: DialogComponent<ConfirmationDialogPayload, ConfirmationDialogResult> = function ConfirmationDialog({
  payload,
  resolveDialog,
  rejectDialog,
  className,
}) {
  const translate = useTranslate();
  const styles = useS(style);
  const {
    icon,
    title,
    subTitle,
    showSkipConfirmations,
    showExtraAction,
    children,
    size = 'small',
    bigIcon,
    viewBox,
    message,
    confirmActionText,
    cancelActionText,
    extraActionText,
  } = payload;
  const [skipConfirmations, setSkipConfirmations] = useState(false);

  function resolve() {
    resolveDialog({
      skipConfirmations,
    });
  }

  function reject() {
    rejectDialog({
      skipConfirmations,
    });
  }

  function extraAction() {
    rejectDialog({
      isExtraAction: true,
      skipConfirmations,
    });
  }

  return (
    <CommonDialogWrapper size={size} className={className} fixedWidth>
      <CommonDialogHeader title={title} subTitle={subTitle} icon={icon} viewBox={viewBox} bigIcon={bigIcon} onReject={reject} />
      <CommonDialogBody>
        <Translate token={message} />
        {children && children?.()}
      </CommonDialogBody>
      <CommonDialogFooter className={s(styles, { footer: true })}>
        {showSkipConfirmations && (
          <div className="tw:w-full tw:flex tw:justify-start">
            <Checkbox
              name="skipConfirmations"
              label={translate('ui_processing_skip_confirmations')}
              checked={skipConfirmations}
              onChange={setSkipConfirmations}
            />
          </div>
        )}
        <Button type="button" variant="secondary" className="tw:shrink-0" onClick={reject}>
          <Translate token={cancelActionText || 'ui_processing_cancel'} />
        </Button>
        <Fill />
        {showExtraAction && (
          <Button type="button" variant="secondary" className="tw:shrink-0" onClick={extraAction}>
            <Translate token={extraActionText || 'ui_no'} />
          </Button>
        )}
        <Button type="button" className="tw:shrink-0" onClick={resolve}>
          <Translate token={confirmActionText || 'ui_processing_ok'} />
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
};
