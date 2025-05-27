/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useRef } from 'react';

import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  Container,
  FieldCheckbox,
  Fill,
  Form,
  Group,
  InputField,
  s,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { DialogComponentProps } from '@cloudbeaver/core-dialogs';

import type { IDatabaseRefreshState } from '../../../../DatabaseDataModel/Actions/DatabaseRefreshAction.js';
import style from './AutoRefreshSettingsDialog.module.css';

interface Payload {
  state: IDatabaseRefreshState;
}

export const AutoRefreshSettingsDialog = observer<DialogComponentProps<Payload>>(function AutoRefreshSettingsDialog({
  rejectDialog,
  resolveDialog,
  payload: { state },
}) {
  const translate = useTranslate();
  const styles = useS(style);
  const formRef = useRef<HTMLFormElement>(null);

  function resolve() {
    formRef.current?.focus();
    const valid = formRef.current?.checkValidity();
    formRef.current?.reportValidity();

    if (valid) {
      resolveDialog();
    }
  }

  return (
    <CommonDialogWrapper size="small">
      <CommonDialogHeader title="plugin_data_viewer_auto_refresh_settings" icon="/icons/settings_cog_m.svg" onReject={rejectDialog} />
      <CommonDialogBody noBodyPadding noOverflow>
        <div className={s(styles, { wrapper: true })}>
          <Form ref={formRef} onSubmit={() => resolve()}>
            <Container>
              <Group form gap>
                <InputField name="interval" state={state} type="number" min={5} max={3600}>
                  {translate('ui_interval')}
                </InputField>

                <FieldCheckbox id="dataViewer.tableViewer.autoRefresh.stopOnError" name="stopOnError" state={state}>
                  {translate('plugin_data_viewer_auto_refresh_settings_stop_on_error')}
                </FieldCheckbox>
              </Group>
            </Container>
          </Form>
        </div>
      </CommonDialogBody>
      <CommonDialogFooter>
        <div className={s(styles, { footerContainer: true })}>
          <div className={s(styles, { buttons: true })}>
            <Button variant="secondary" onClick={() => rejectDialog()}>
              {translate('ui_processing_cancel')}
            </Button>
            <Fill />
            <Button onClick={() => resolve()}>{translate('ui_processing_ok')}</Button>
          </div>
        </div>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
