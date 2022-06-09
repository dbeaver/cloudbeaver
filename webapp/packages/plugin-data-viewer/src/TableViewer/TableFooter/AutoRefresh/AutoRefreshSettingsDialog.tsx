/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useRef } from 'react';
import styled, { css } from 'reshadow';

import { BASE_CONTAINERS_STYLES, Button, Container, FieldCheckbox, Group, InputField, SubmittingForm } from '@cloudbeaver/core-blocks';
import { CommonDialogWrapper, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';

import type { IAutoRefreshSettings } from './IAutoRefreshSettings';

const styles = css`
    footer-container {
      display: flex;
      width: min-content;
      flex: 1;
      align-items: center;
      justify-content: flex-end;
      gap: 24px;
    }
    buttons {
      flex: 1;
      display: flex;
      gap: 24px;
    }
    wrapper {
      display: flex;
      height: 100%;
      width: 100%;
      overflow: auto;
    }
    fill {
      flex: 1;
    }
`;

interface Payload {
  settings: IAutoRefreshSettings;
}

export const AutoRefreshSettingsDialog = observer<DialogComponentProps<Payload>>(function AutoRefreshSettingsDialog({
  rejectDialog,
  resolveDialog,
  payload,
}) {
  const translate = useTranslate();
  const formRef = useRef<HTMLFormElement>(null);

  function resolve() {
    formRef.current?.focus();
    const valid = formRef.current?.checkValidity();
    formRef.current?.reportValidity();

    if (valid) {
      resolveDialog();
    }
  }

  return styled(styles, BASE_CONTAINERS_STYLES)(
    <CommonDialogWrapper
      size='small'
      title='data_viewer_auto_refresh_settings'
      icon='/icons/settings_cog_m.svg'
      footer={(
        <footer-container>
          <buttons>
            <Button mod={['outlined']} onClick={() => rejectDialog()}>{translate('ui_processing_cancel')}</Button>
            <fill />
            <Button mod={['unelevated']} onClick={() => resolve()}>{translate('ui_processing_ok')}</Button>
          </buttons>
        </footer-container>
      )}
      noBodyPadding
      noOverflow
      onReject={rejectDialog}
    >
      <wrapper>
        <SubmittingForm ref={formRef} onSubmit={() => resolve()}>
          <Container>
            <Group form gap>
              <InputField
                name='interval'
                state={payload.settings}
                type='number'
                min={5}
                max={3600}
              >
                {translate('ui_interval')}
              </InputField>

              <FieldCheckbox
                id="dataViewer.tableViewer.autoRefresh.stopOnError"
                name="stopOnError"
                state={payload.settings}
              >
                {translate('data_viewer_auto_refresh_settings_stop_on_error')}
              </FieldCheckbox>
            </Group>
          </Container>
        </SubmittingForm>
      </wrapper>
    </CommonDialogWrapper>
  );
});