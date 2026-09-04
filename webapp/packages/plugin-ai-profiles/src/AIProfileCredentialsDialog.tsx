/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
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
  InputField,
  SAVED_VALUE_INDICATOR,
  useFocus,
  useForm,
  useObservableRef,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult, type DialogComponent } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';

import type { IAIProfileCredentialsDialogPayload } from './IAIProfileCredentialsDialogPayload.js';
import { AIProfilesResource } from './AIProfilesResource.js';

interface CredentialsDialogState {
  token: string;
  processing: boolean;
}

export const AIProfileCredentialsDialog: DialogComponent<IAIProfileCredentialsDialogPayload> = observer(function AIProfileCredentialsDialog({
  payload,
  resolveDialog,
  rejectDialog,
}) {
  const translate = useTranslate();
  const commonDialogService = useService(CommonDialogService);
  const notificationService = useService(NotificationService);
  const aiProfilesResource = useService(AIProfilesResource);
  const [tokenRef] = useFocus<HTMLInputElement>({ autofocus: true });
  const state = useObservableRef<CredentialsDialogState>(
    () => ({ token: '', processing: false }),
    { token: observable.ref, processing: observable.ref },
    false,
  );
  const credentialsSaved = aiProfilesResource.get(payload.profileId)?.credentialsSaved ?? false;
  const form = useForm({ onSubmit: save });

  async function save(): Promise<void> {
    if (state.processing || !state.token) {
      return;
    }

    try {
      state.processing = true;
      if (state.token) {
        const saved = await aiProfilesResource.saveCredentials(payload.profileId, state.token);
        if (!saved) {
          throw new Error(translate('plugin_ai_credentials_save_failed'));
        }
        state.token = '';
        notificationService.logSuccess({
          title: 'plugin_ai_credentials_saved',
          message: payload.profileName,
        });
      } else if (!credentialsSaved) {
        return;
      }

      resolveDialog();
    } catch (exception: any) {
      notificationService.logException(exception, 'plugin_ai_credentials_save_failed');
    } finally {
      state.processing = false;
    }
  }

  async function resetCredentials(): Promise<void> {
    const { status } = await commonDialogService.open(ConfirmationDialog, {
      title: translate('plugin_ai_credentials_reset_title'),
      message: 'plugin_ai_credentials_reset_confirmation',
      confirmActionText: 'plugin_ai_credentials_reset',
    });

    if (status === DialogueStateResult.Resolved) {
      try {
        state.processing = true;
        const reset = await aiProfilesResource.resetCredentials(payload.profileId);
        if (!reset) {
          throw new Error(translate('plugin_ai_credentials_reset_failed'));
        }
        state.token = '';
        notificationService.logSuccess({
          title: 'plugin_ai_credentials_reset_success',
          message: payload.profileName,
        });
      } catch (exception: any) {
        notificationService.logException(exception, 'plugin_ai_credentials_reset_failed');
      } finally {
        state.processing = false;
      }
    }
  }

  return (
    <Form context={form} contents>
      <CommonDialogWrapper size="medium" autoFocusOnShow={false} fixedWidth>
        <CommonDialogHeader
          title="plugin_ai_credentials_dialog_title"
          subTitle="plugin_ai_credentials_dialog_description"
          icon={payload.engineIcon}
          onReject={state.processing ? undefined : rejectDialog}
        />
        <CommonDialogBody>
          <Container gap>
            <InputField value={payload.profileName} disabled={state.processing} readOnly>
              {translate('plugin_ai_credentials_profile')}
            </InputField>
            <InputField value={payload.engineName} disabled={state.processing} readOnly>
              {translate('plugin_ai_credentials_engine')}
            </InputField>
            <InputField
              ref={tokenRef}
              state={state}
              type="password"
              name="token"
              autoComplete="new-password"
              required={!credentialsSaved}
              disabled={state.processing}
              placeholder={credentialsSaved ? SAVED_VALUE_INDICATOR : undefined}
              description={credentialsSaved ? translate('ui_processing_saved') : undefined}
            >
              {translate('plugin_ai_credentials_token')}
            </InputField>
          </Container>
        </CommonDialogBody>
        <CommonDialogFooter>
          {credentialsSaved && (
            <Button type="button" variant="secondary" disabled={state.processing} onClick={resetCredentials}>
              {translate('plugin_ai_credentials_reset')}
            </Button>
          )}
          <Fill />
          <Button type="button" variant="secondary" disabled={state.processing} onClick={() => rejectDialog()}>
            {translate('ui_processing_cancel')}
          </Button>
          <Button type="submit" disabled={state.processing || !state.token} onClick={() => form.submit()}>
            {translate('ui_processing_save')}
          </Button>
        </CommonDialogFooter>
      </CommonDialogWrapper>
    </Form>
  );
});
