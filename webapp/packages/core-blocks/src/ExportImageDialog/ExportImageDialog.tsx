/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import {
  Button,
  Select,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  Container,
  ErrorMessage,
  FieldCheckbox,
  s,
  useErrorDetails,
  useS,
  useTranslate,
  useObservableRef,
  InputField,
} from '@cloudbeaver/core-blocks';
import type { DialogComponentProps } from '@cloudbeaver/core-dialogs';

import style from './ExportImageDialog.module.css';
import { observable } from 'mobx';

export interface IExportImageOptions {
  format: ExportFormat;
  transparent: boolean;
  fileName: string;
}

type ExportFormat = 'SVG' | 'PNG';

export const EXPORT_FORMATS: ExportFormat[] = ['SVG', 'PNG'];

export interface ExportImagePayload {
  onExport: (options: IExportImageOptions) => void;
  defaultFileName: string;
}

interface State extends IExportImageOptions {
  error: Error | null;
}

export const ExportImageDialog = observer<DialogComponentProps<ExportImagePayload, null>>(function ExportImageDialog(props) {
  const translate = useTranslate();
  const styles = useS(style);
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

  const onExportHandler = () => {
    try {
      props.payload.onExport(state);
      props.resolveDialog();
    } catch (error: any) {
      state.error = error;
    }
  };

  return (
    <CommonDialogWrapper size="small">
      <CommonDialogHeader title="core_blocks_export_image_dialog_title" onReject={props.rejectDialog} />
      <CommonDialogBody>
        <Container>
          <Container small gap>
            <InputField state={state} name="fileName">
              {translate('ui_name')}
            </InputField>
            <Select items={EXPORT_FORMATS} keySelector={value => value} valueSelector={value => value} state={state} name="format">
              {translate('core_blocks_export_image_dialog_format')}
            </Select>
            <FieldCheckbox state={state} name="transparent" label={translate('core_blocks_export_image_dialog_transparent_background')} />
          </Container>
        </Container>
        {errorDetails.name && (
          <ErrorMessage text={errorDetails.message || errorDetails.name} hasDetails={errorDetails.hasDetails} onShowDetails={errorDetails.open} />
        )}
      </CommonDialogBody>
      <CommonDialogFooter className={s(styles, { footer: true })}>
        <Button type="button" variant="secondary" onClick={props.rejectDialog}>
          {translate('app_shared_inlineEditor_dialog_cancel')}
        </Button>
        <Button type="button" onClick={onExportHandler}>
          {translate('ui_export')}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
