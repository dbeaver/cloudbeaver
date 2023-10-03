/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useRef } from 'react';

import { Button, Container, FieldCheckbox, Fill, Form, Group, InputField, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { CommonDialogBody, CommonDialogFooter, CommonDialogHeader, CommonDialogWrapper, DialogComponentProps } from '@cloudbeaver/core-dialogs';

import style from './AutoRefreshSettingsDialog.m.css';
import type { IAutoRefreshSettings } from './IAutoRefreshSettings';

interface Payload {
  settings: IAutoRefreshSettings;
}

export const AutoRefreshSettingsDialog = observer<DialogComponentProps<Payload>>(function AutoRefreshSettingsDialog({
  rejectDialog,
  resolveDialog,
  payload,
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
      <CommonDialogHeader title="data_viewer_auto_refresh_settings" icon="/icons/settings_cog_m.svg" onReject={rejectDialog} />
      <CommonDialogBody noBodyPadding noOverflow>
        <div className={s(styles, { wrapper: true })}>
          <Form ref={formRef} onSubmit={() => resolve()}>
            <Container>
              <Group form gap>
                <InputField name="interval" state={payload.settings} type="number" min={5} max={3600}>
                  {translate('ui_interval')}
                </InputField>

                <FieldCheckbox id="dataViewer.tableViewer.autoRefresh.stopOnError" name="stopOnError" state={payload.settings}>
                  {translate('data_viewer_auto_refresh_settings_stop_on_error')}
                </FieldCheckbox>
              </Group>
            </Container>
          </Form>
        </div>
      </CommonDialogBody>
      <CommonDialogFooter>
        <div className={s(styles, { footerContainer: true })}>
          <div className={s(styles, { buttons: true })}>
            <Button mod={['outlined']} onClick={() => rejectDialog()}>
              {translate('ui_processing_cancel')}
            </Button>
            <Fill />
            <Button mod={['unelevated']} onClick={() => resolve()}>
              {translate('ui_processing_ok')}
            </Button>
          </div>
        </div>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
