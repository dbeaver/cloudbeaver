/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { Button, ConfirmationDialog, Container, InputField, SAVED_VALUE_INDICATOR, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IFormProps } from '@cloudbeaver/core-ui';

import { getAIProfileCredentialsFormPart } from './getAIProfileCredentialsFormPart.js';
import type { IAIProfileCredentialsFormState } from './IAIProfileCredentialsFormState.js';
import { AIProfilesResource, type AIProfile } from '../AIProfilesResource.js';

interface Props extends IFormProps<IAIProfileCredentialsFormState> {
  profile: AIProfile;
}

export const AIProfileTokenFields = observer<Props>(function AIProfileTokenFields({ formState, profile }) {
  const translate = useTranslate();
  const commonDialogService = useService(CommonDialogService);
  const notificationService = useService(NotificationService);
  const part = getAIProfileCredentialsFormPart(formState);
  const aiProfilesResource = useService(AIProfilesResource);
  const [resetting, setResetting] = useState(false);

  async function resetCredentials(): Promise<void> {
    const { status } = await commonDialogService.open(ConfirmationDialog, {
      title: translate('plugin_ai_credentials_reset_title'),
      message: 'plugin_ai_credentials_reset_confirmation',
      confirmActionText: 'plugin_ai_credentials_reset',
    });
    if (status !== DialogueStateResult.Resolved) {
      return;
    }
    setResetting(true);
    try {
      await aiProfilesResource.resetCredentials(profile.id);
    } catch (exception: any) {
      notificationService.logException(exception, 'plugin_ai_credentials_reset_failed');
    } finally {
      setResetting(false);
    }
  }

  return (
    <>
      <InputField
        state={part.state}
        type="password"
        name="token"
        autoComplete="new-password"
        required={!profile.tokenSaved}
        disabled={formState.isDisabled || resetting}
        placeholder={profile.tokenSaved ? SAVED_VALUE_INDICATOR : undefined}
        description={profile.tokenSaved ? translate('ui_processing_saved') : undefined}
      >
        {translate('plugin_ai_credentials_token')}
      </InputField>
      {profile.tokenSaved && (
        <Container className="tw:self-start" keepSize>
          <Button type="button" variant="secondary" disabled={formState.isDisabled || resetting} onClick={resetCredentials}>
            {translate('plugin_ai_credentials_reset')}
          </Button>
        </Container>
      )}
    </>
  );
});
