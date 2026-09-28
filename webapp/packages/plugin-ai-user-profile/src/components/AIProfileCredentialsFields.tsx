/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Button, ConfirmationDialog, Container, Group, InputField, SAVED_VALUE_INDICATOR, useAutoLoad, useFocus, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { AIProfilesResource } from '@cloudbeaver/plugin-ai-profiles';

import { getAIProfileCredentialsFormPart } from '../AIProfileCredentialsForm/getAIProfileCredentialsFormPart.js';
import type { IAIProfileCredentialsFormProps } from '../AIProfileCredentialsForm/IAIProfileCredentialsFormProps.js';

export const AIProfileCredentialsFields: TabContainerPanelComponent<IAIProfileCredentialsFormProps> = observer(function AIProfileCredentialsFields({
  formState,
}) {
  const translate = useTranslate();
  const notificationService = useService(NotificationService);
  const commonDialogService = useService(CommonDialogService);
  const [tokenRef] = useFocus<HTMLInputElement>({ autofocus: true });
  const part = getAIProfileCredentialsFormPart(formState);
  const aiProfilesResource = useService(AIProfilesResource);
  const state = part.state;
  const credentialsSaved = part.credentialsSaved;

  useAutoLoad(AIProfileCredentialsFields, part);

  async function resetCredentials(): Promise<void> {
    if (!state) {
      return;
    }

    const { status } = await commonDialogService.open(ConfirmationDialog, {
      title: translate('plugin_ai_credentials_reset_title'),
      message: 'plugin_ai_credentials_reset_confirmation',
      confirmActionText: 'plugin_ai_credentials_reset',
    });

    if (status !== DialogueStateResult.Resolved) {
      return;
    }

    try {
      await aiProfilesResource.resetCredentials(formState.state.profileId);
      notificationService.logSuccess({
        title: 'plugin_ai_user_profile_credentials_reset',
        message: state.profileName,
      });
    } catch (exception: any) {
      notificationService.logException(exception, 'plugin_ai_credentials_reset_failed');
    }
  }

  return (
    <Group className="tw:w-full" small keepSize gap>
      <Container vertical gap>
        <InputField value={state.profileName} disabled={formState.isDisabled} readOnly>
          {translate('plugin_ai_credentials_profile')}
        </InputField>
        <InputField value={state.engineName} disabled={formState.isDisabled} readOnly>
          {translate('plugin_ai_credentials_engine')}
        </InputField>
        <InputField
          ref={tokenRef}
          state={state}
          type="password"
          name="token"
          autoComplete="new-password"
          required={!credentialsSaved}
          disabled={formState.isDisabled}
          placeholder={credentialsSaved ? SAVED_VALUE_INDICATOR : undefined}
          description={credentialsSaved ? translate('ui_processing_saved') : undefined}
        >
          {translate('plugin_ai_credentials_token')}
        </InputField>
      </Container>
      {credentialsSaved && (
        <div>
          <Button type="button" variant="secondary" disabled={formState.isDisabled} onClick={resetCredentials}>
            {translate('plugin_ai_credentials_reset')}
          </Button>
        </div>
      )}
    </Group>
  );
});
