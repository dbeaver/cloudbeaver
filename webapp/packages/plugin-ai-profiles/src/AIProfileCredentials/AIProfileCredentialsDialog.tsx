/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useState } from 'react';

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
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult, type DialogComponent } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';

import { AIProfilesResource } from '../AIProfilesResource.js';

export interface IAIProfileCredentialsDialogPayload {
  profileId: string;
  profileName: string;
  engineName: string;
  engineIcon?: string;
}

export const AIProfileCredentialsDialog: DialogComponent<IAIProfileCredentialsDialogPayload> = observer(function AIProfileCredentialsDialog({
  payload,
  resolveDialog,
  rejectDialog,
}) {
  const translate = useTranslate();
  const commonDialogService = useService(CommonDialogService);
  const notificationService = useService(NotificationService);
  const aiProfilesResource = useResource(AIProfileCredentialsDialog, AIProfilesResource, payload.profileId);
  const [tokenRef] = useFocus<HTMLInputElement>({ autofocus: true });
  const [token, setToken] = useState('');
  const [processing, setProcessing] = useState(false);
  const credentialsSaved = aiProfilesResource.data?.credentialsSaved ?? false;
  const form = useForm({ onSubmit: save });

  async function save(): Promise<void> {
    if (processing || !token) {
      return;
    }

    try {
      setProcessing(true);
      await aiProfilesResource.resource.saveCredentials(payload.profileId, token);

      setToken('');
      notificationService.logSuccess({
        title: 'plugin_ai_credentials_saved',
        message: payload.profileName,
      });
      resolveDialog();
    } catch (exception: any) {
      notificationService.logException(exception, 'plugin_ai_credentials_save_failed');
    } finally {
      setProcessing(false);
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
        setProcessing(true);
        await aiProfilesResource.resource.resetCredentials(payload.profileId);

        setToken('');
        notificationService.logSuccess({
          title: 'plugin_ai_credentials_reset_success',
          message: payload.profileName,
        });
      } catch (exception: any) {
        notificationService.logException(exception, 'plugin_ai_credentials_reset_failed');
      } finally {
        setProcessing(false);
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
          onReject={processing ? undefined : rejectDialog}
        />
        <CommonDialogBody>
          <Container gap>
            <InputField value={payload.profileName} disabled={processing} readOnly>
              {translate('plugin_ai_credentials_profile')}
            </InputField>
            <InputField value={payload.engineName} disabled={processing} readOnly>
              {translate('plugin_ai_credentials_engine')}
            </InputField>
            <InputField
              ref={tokenRef}
              value={token}
              type="password"
              name="token"
              autoComplete="new-password"
              required={!credentialsSaved}
              disabled={processing}
              placeholder={credentialsSaved ? SAVED_VALUE_INDICATOR : undefined}
              description={credentialsSaved ? translate('ui_processing_saved') : undefined}
              onChange={setToken}
            >
              {translate('plugin_ai_credentials_token')}
            </InputField>
          </Container>
        </CommonDialogBody>
        <CommonDialogFooter>
          {credentialsSaved && (
            <Button type="button" variant="secondary" disabled={processing} onClick={resetCredentials}>
              {translate('plugin_ai_credentials_reset')}
            </Button>
          )}
          <Fill />
          <Button type="button" variant="secondary" disabled={processing} onClick={() => rejectDialog()}>
            {translate('ui_processing_cancel')}
          </Button>
          <Button type="submit" disabled={processing || !token} onClick={() => form.submit()}>
            {translate('ui_processing_save')}
          </Button>
        </CommonDialogFooter>
      </CommonDialogWrapper>
    </Form>
  );
});
