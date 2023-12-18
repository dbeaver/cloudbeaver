/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Button, Fill, s, useS, useTranslate } from '@cloudbeaver/core-blocks';

import style from './ProcessorConfigureDialogFooter.m.css';

interface Props {
  isExporting: boolean;
  isFinalStep: boolean;
  onCancel: () => void;
  onExport: () => void;
  onBack: () => void;
  onNext: () => void;
}

export const ProcessorConfigureDialogFooter = observer<Props>(function ProcessorConfigureDialogFooter({
  isExporting,
  isFinalStep,
  onCancel,
  onExport,
  onBack,
  onNext,
}) {
  const translate = useTranslate();
  const styles = useS(style);

  return (
    <div className={s(styles, { controls: true })}>
      <Button type="button" mod={['outlined']} disabled={isExporting} onClick={onBack}>
        {translate('ui_stepper_back')}
      </Button>
      <Fill />
      <Button type="button" mod={['outlined']} disabled={isExporting} onClick={onCancel}>
        {translate('ui_processing_cancel')}
      </Button>
      {isFinalStep ? (
        <Button type="button" mod={['unelevated']} disabled={isExporting} onClick={onExport}>
          {translate('data_transfer_dialog_export')}
        </Button>
      ) : (
        <Button type="button" mod={['unelevated']} disabled={isExporting} onClick={onNext}>
          {translate('ui_stepper_next')}
        </Button>
      )}
    </div>
  );
});
