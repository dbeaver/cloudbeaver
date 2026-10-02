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
  Container,
  Fill,
  Form,
  InputField,
  useForm,
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';

import { AIProfilesResource, type IAIProfileCredentialsState } from '../AIProfilesResource.js';
import { AIProfileCredentialsFields } from './AIProfileCredentialsFields.js';

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
  const notificationService = useService(NotificationService);
  const aiProfilesResource = useResource(AIProfileCredentialsDialog, AIProfilesResource, payload.profileId);
  const profile = aiProfilesResource.data;
  const [state, setState] = useState<IAIProfileCredentialsState>(() => ({
    token: '',
    accountAuthentication: !!profile?.accountProvider && profile.accountAuthentication,
  }));
  const [processing, setProcessing] = useState(false);
  const [credentialsProcessing, setCredentialsProcessing] = useState(false);
  const accountAuthentication = !!profile?.accountProvider && state.accountAuthentication;
  const changed = !!state.token || (!!profile?.accountProvider && state.accountAuthentication !== profile.accountAuthentication);
  const credentialsMissing = accountAuthentication ? !profile?.account : !state.token && !profile?.tokenSaved;
  const saveDisabled = processing || credentialsProcessing || !profile || profile.global || !changed || credentialsMissing;
  const form = useForm({ onSubmit: save });

  async function save(): Promise<void> {
    if (saveDisabled) {
      return;
    }

    try {
      setProcessing(true);
      await aiProfilesResource.resource.saveCredentials(payload.profileId, state.token, accountAuthentication);

      credentialsChanged(accountAuthentication);
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

  function credentialsChanged(accountAuthentication: boolean): void {
    setState({ token: '', accountAuthentication });
  }

  return (
    <Form context={form} contents>
      <CommonDialogWrapper size="medium" aria-label={translate('plugin_ai_credentials_dialog_title')} fixedWidth>
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
            <AIProfileCredentialsFields
              key={payload.profileId}
              profileId={payload.profileId}
              state={state}
              disabled={processing || credentialsProcessing}
              onChange={setState}
              onProcessing={setCredentialsProcessing}
              onCredentialsChanged={credentialsChanged}
              onAuthorized={resolveDialog}
            />
          </Container>
        </CommonDialogBody>
        <CommonDialogFooter>
          <Fill />
          <Button type="button" variant="secondary" disabled={processing} onClick={() => rejectDialog()}>
            {translate('ui_processing_cancel')}
          </Button>
          <Button type="submit" disabled={saveDisabled} onClick={() => form.submit()}>
            {translate('ui_processing_save')}
          </Button>
        </CommonDialogFooter>
      </CommonDialogWrapper>
    </Form>
  );
});
