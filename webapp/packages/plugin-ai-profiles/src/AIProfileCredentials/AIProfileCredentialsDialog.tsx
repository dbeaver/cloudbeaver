/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  Container,
  Fill,
  Form,
  StatusMessage,
  useForm,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IFormState } from '@cloudbeaver/core-ui';
import { getFirstException } from '@cloudbeaver/core-utils';

import { AIProfileCredentialsFields } from './AIProfileCredentialsFields.js';
import { getAIProfileCredentialsFormPart } from './getAIProfileCredentialsFormPart.js';
import type { IAIProfileCredentialsFormState } from './IAIProfileCredentialsFormState.js';

export interface IAIProfileCredentialsDialogPayload {
  formState: IFormState<IAIProfileCredentialsFormState>;
}

export const AIProfileCredentialsDialog: DialogComponent<IAIProfileCredentialsDialogPayload> = observer(function AIProfileCredentialsDialog({
  payload,
  resolveDialog,
  rejectDialog,
}) {
  const translate = useTranslate();
  const notificationService = useService(NotificationService);
  const { formState } = payload;
  const part = getAIProfileCredentialsFormPart(formState);
  const error = getFirstException(formState.exception);
  const isSaving = !!formState.savingPromise;
  const form = useForm({
    onSubmit: async function onSubmit() {
      const saved = await formState.save();
      const exception = getFirstException(formState.exception);

      if (saved) {
        notificationService.logSuccess({
          title: 'plugin_ai_credentials_saved',
          message: part.currentProfile?.name,
        });
        resolveDialog();
      } else if (exception) {
        notificationService.logException(exception, 'plugin_ai_credentials_save_failed');
      }
    },
  });

  return (
    <Form context={form} contents>
      <CommonDialogWrapper size="medium" aria-label={translate('plugin_ai_credentials_dialog_title')} fixedWidth>
        <CommonDialogHeader
          title="plugin_ai_credentials_dialog_title"
          subTitle="plugin_ai_credentials_dialog_description"
          icon={part.currentEngine?.icon}
          onReject={isSaving ? undefined : rejectDialog}
        />
        <CommonDialogBody>
          <Container gap>
            {error && <StatusMessage exception={error} />}
            <AIProfileCredentialsFields formState={formState} />
          </Container>
        </CommonDialogBody>
        <CommonDialogFooter>
          <Fill />
          <Button type="button" variant="secondary" disabled={isSaving} onClick={() => rejectDialog()}>
            {translate('ui_processing_cancel')}
          </Button>
          <Button type="submit" disabled={formState.isDisabled || isSaving}>
            {translate('ui_processing_save')}
          </Button>
        </CommonDialogFooter>
      </CommonDialogWrapper>
    </Form>
  );
});
