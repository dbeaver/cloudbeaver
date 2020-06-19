/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { Button } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';

const styles = css`
  controls {
    display: flex;
    flex: 1;
    height: 100%;
    align-items: center;
    margin: auto;
  }

  fill {
    flex: 1;
  }

  Button:not(:first-child) {
    margin-left: 24px;
  }
`;

type Props = {
  isExporting: boolean;
  onCancel(): void;
  onExport(): void;
  onBack(): void;
}

export const ProcessorConfigureDialogFooter = observer(
  function ProcessorConfigureDialogFooter({
    isExporting,
    onCancel,
    onExport,
    onBack,
  }: Props) {
    const translate = useTranslate();

    return styled(styles)(
      <controls as="div">
        <Button
          type="button"
          mod={['outlined']}
          onClick={onBack}
          disabled={isExporting}
        >
          {translate('ui_stepper_back')}
        </Button>
        <fill as="div"/>
        <Button
          type="button"
          mod={['outlined']}
          onClick={onCancel}
          disabled={isExporting}
        >
          {translate('ui_processing_cancel')}
        </Button>
        <Button
          type="button"
          mod={['unelevated']}
          onClick={onExport}
          disabled={isExporting}
        >
          {translate('data_transfer_dialog_export')}
        </Button>
      </controls>
    );
  }
);
