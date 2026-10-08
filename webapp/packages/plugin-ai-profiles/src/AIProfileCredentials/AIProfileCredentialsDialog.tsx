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
  ConfirmationDialog,
  Container,
  Fill,
  Form,
  StatusMessage,
  useForm,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult, type DialogComponent } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { AiEnginesResource } from '@cloudbeaver/plugin-ai';
import type { IFormState } from '@cloudbeaver/core-ui';
import { getFirstException } from '@cloudbeaver/core-utils';

import { AIProfileCredentialsFields } from './AIProfileCredentialsFields.js';
import { getAIProfileAuthorizationController } from './getAIProfileAuthorizationController.js';
import { AIProfilesResource } from '../AIProfilesResource.js';
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
  const commonDialogService = useService(CommonDialogService);
  const { formState } = payload;
  const profiles = useService(AIProfilesResource);
  const engines = useService(AiEnginesResource);
  const profile = profiles.get(formState.state.profileId);
  const engine = engines.data.find(engine => engine.id === profile?.engineId);
  const profileAuthController = getAIProfileAuthorizationController(formState);
  const error = getFirstException(formState.exception);
  const isSaving = !!formState.savingPromise;
  const form = useForm({
    onSubmit: async function onSubmit() {
      const saved = await formState.save();
      const exception = getFirstException(formState.exception);

      if (saved) {
        notificationService.logSuccess({
          title: 'plugin_ai_credentials_saved',
          message: profile?.name,
        });
        resolveDialog();
      } else if (exception) {
        notificationService.logException(exception, 'plugin_ai_credentials_save_failed');
      }
    },
  });

  async function close(): Promise<void> {
    if (isSaving) {
      return;
    }
    if (formState.isChanged) {
      const { status } = await commonDialogService.open(ConfirmationDialog, {
        title: 'ui_discard_changes',
        message: 'ui_discard_changes_message',
        confirmActionText: 'ui_discard',
        cancelActionText: 'ui_keep_editing',
      });
      if (status !== DialogueStateResult.Resolved) {
        return;
      }
    }
    if (await profileAuthController.confirmLeave()) {
      rejectDialog();
    }
  }

  return (
    <CommonDialogWrapper size="medium" aria-label={translate('plugin_ai_credentials_dialog_title')} fixedWidth>
      <CommonDialogHeader
        title="plugin_ai_credentials_dialog_title"
        subTitle="plugin_ai_credentials_dialog_description"
        icon={engine?.icon}
        onReject={isSaving ? undefined : close}
      />
      <CommonDialogBody>
        <Form context={form} contents>
          <Container gap>
            {error && <StatusMessage exception={error} />}
            <AIProfileCredentialsFields formState={formState} />
          </Container>
        </Form>
      </CommonDialogBody>
      <CommonDialogFooter>
        <Fill />
        <Button type="button" variant="secondary" disabled={isSaving} onClick={close}>
          {translate('ui_processing_cancel')}
        </Button>
        <Button type="button" disabled={formState.isDisabled || isSaving || !formState.isChanged} onClick={() => form.submit()}>
          {translate('ui_processing_save')}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
