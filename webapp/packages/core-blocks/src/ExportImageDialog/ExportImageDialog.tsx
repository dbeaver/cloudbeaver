/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import type { DialogComponentProps } from '@cloudbeaver/core-dialogs';

import { observable } from 'mobx';
import { EXPORT_IMAGE_FORMATS, type ExportImageFormat } from './ExportImageFormats.js';
import { useTranslate } from '../localization/useTranslate.js';
import { useObservableRef } from '../useObservableRef.js';
import { CommonDialogBody } from '../CommonDialog/CommonDialog/CommonDialogBody.js';
import { CommonDialogFooter } from '../CommonDialog/CommonDialog/CommonDialogFooter.js';
import { CommonDialogHeader } from '../CommonDialog/CommonDialog/CommonDialogHeader.js';
import { CommonDialogWrapper } from '../CommonDialog/CommonDialog/CommonDialogWrapper.js';
import { Container } from '../Containers/Container.js';
import { ErrorMessage } from '../ErrorMessage.js';
import { FieldCheckbox } from '../FormControls/Checkboxes/FieldCheckbox.js';
import { InputField } from '../FormControls/InputField/InputField.js';
import { useErrorDetails } from '../useErrorDetails.js';
import { Select } from '../FormControls/Select.js';
import { Button } from '../Button.js';

export interface IExportImageOptions {
  format: ExportImageFormat;
  transparent: boolean;
  fileName: string;
}

export interface ExportImagePayload {
  export: (options: IExportImageOptions) => Promise<void>;
  defaultFileName: string;
}

interface State extends IExportImageOptions {
  error: Error | null;
}

export const ExportImageDialog = observer<DialogComponentProps<ExportImagePayload>>(function ExportImageDialog(props) {
  const translate = useTranslate();
  const state = useObservableRef<State>(
    () => ({
      format: 'SVG',
      transparent: false,
      fileName: props.payload.defaultFileName,
      error: null,
    }),
    {
      format: observable.ref,
      transparent: observable.ref,
      fileName: observable.ref,
      error: observable.ref,
    },
    false,
  );
  const errorDetails = useErrorDetails(state.error);

  async function onExportHandler() {
    try {
      await props.payload.export(state);
      props.resolveDialog();
    } catch (error: any) {
      state.error = error;
    }
  }

  return (
    <CommonDialogWrapper size="small">
      <CommonDialogHeader title="core_blocks_export_image_dialog_title" onReject={props.rejectDialog} />
      <CommonDialogBody>
        <Container>
          <Container small gap>
            <InputField state={state} name="fileName">
              {translate('ui_name')}
            </InputField>
            <Select items={EXPORT_IMAGE_FORMATS} keySelector={value => value} valueSelector={value => value} state={state} name="format">
              {translate('core_blocks_export_image_dialog_format')}
            </Select>
            <FieldCheckbox state={state} name="transparent" label={translate('core_blocks_export_image_dialog_transparent_background')} />
          </Container>
        </Container>
        {errorDetails.name && (
          <ErrorMessage text={errorDetails.message || errorDetails.name} hasDetails={errorDetails.hasDetails} onShowDetails={errorDetails.open} />
        )}
      </CommonDialogBody>
      <CommonDialogFooter className="tw:justify-end tw:items-center tw:gap-6!">
        <Button type="button" variant="secondary" onClick={() => props.rejectDialog()}>
          {translate('app_shared_inlineEditor_dialog_cancel')}
        </Button>
        <Button type="button" onClick={onExportHandler}>
          {translate('ui_export')}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
