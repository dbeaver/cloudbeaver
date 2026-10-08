/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { Button, ConfirmationDialog, Container, InputField, Loader, useClipboard, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IFormProps } from '@cloudbeaver/core-ui';

import { AIProfilesResource, type AIProfile } from '../AIProfilesResource.js';
import type { AIProfileAuthorizationController } from './AIProfileAuthorizationController.js';
import { getAIProfileAuthorizationController } from './getAIProfileAuthorizationController.js';
import type { IAIProfileCredentialsFormState } from './IAIProfileCredentialsFormState.js';

interface Props extends IFormProps<IAIProfileCredentialsFormState> {
  profile: AIProfile;
}

export const AIProfileSubscriptionFields = observer<Props>(function AIProfileSubscriptionFields({ formState, profile }) {
  const controller = getAIProfileAuthorizationController(formState);

  if (controller.processing) {
    return <PendingSubscription profile={profile} controller={controller} />;
  }

  if (profile.account) {
    return <ConnectedSubscription profile={profile} disabled={formState.isDisabled} />;
  }

  return <ConnectSubscription disabled={formState.isDisabled || !profile.deviceAuthorizationAvailable} controller={controller} />;
});

const ConnectedSubscription = observer<{ profile: AIProfile; disabled: boolean }>(function ConnectedSubscription({ profile, disabled }) {
  const translate = useTranslate();
  const dialogs = useService(CommonDialogService);
  const notifications = useService(NotificationService);
  const profiles = useService(AIProfilesResource);
  const [processing, setProcessing] = useState(false);

  async function disconnect(): Promise<void> {
    const { status } = await dialogs.open(ConfirmationDialog, {
      title: 'plugin_ai_account_disconnect',
      message: 'plugin_ai_account_disconnect_confirmation',
      confirmActionText: 'plugin_ai_account_disconnect',
    });
    if (status !== DialogueStateResult.Resolved) {
      return;
    }
    setProcessing(true);
    try {
      await profiles.disconnectAccount(profile.id);
      notifications.logSuccess({ title: 'plugin_ai_account_disconnected', message: profile.name });
    } catch (exception: any) {
      notifications.logException(exception, 'plugin_ai_account_disconnect_failed');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <>
      <div role="status">
        {translate('plugin_ai_account_connected')}
        {profile.account?.email ? `: ${profile.account.email}` : ''}
      </div>
      <Container className="tw:self-start" keepSize>
        <Button type="button" variant="secondary" disabled={disabled || processing} onClick={disconnect}>
          {translate('plugin_ai_account_disconnect')}
        </Button>
      </Container>
    </>
  );
});

const ConnectSubscription = observer<{ disabled: boolean; controller: AIProfileAuthorizationController }>(function ConnectSubscription({
  disabled,
  controller,
}) {
  const translate = useTranslate();
  return (
    <Container className="tw:self-start" keepSize>
      <Button type="button" disabled={disabled} onClick={() => controller.connect()}>
        {translate('plugin_ai_account_connect')}
      </Button>
    </Container>
  );
});

const PendingSubscription = observer<{ profile: AIProfile; controller: AIProfileAuthorizationController }>(function PendingSubscription({
  profile,
  controller,
}) {
  const translate = useTranslate();
  const copy = useClipboard();
  const authorization = controller.authorization;
  return (
    <>
      <div role="status">
        <Loader message="plugin_ai_device_waiting" hideMessage={false} inline small />
      </div>
      {authorization && (
        <>
          <InputField value={authorization.userCode} readOnly onCustomCopy={() => copy(authorization.userCode, true)}>
            {translate('plugin_ai_device_code')}
          </InputField>
          <a href={authorization.verificationUri} target="_blank" rel="noopener noreferrer">
            {translate('plugin_ai_device_open_provider', undefined, { provider: profile.accountProvider ?? '' })}
          </a>
          <p>{translate('plugin_ai_device_instructions')}</p>
          <p>{translate('plugin_ai_device_expiration', undefined, { minutes: Math.ceil(authorization.expiresInSeconds / 60) })}</p>
        </>
      )}
    </>
  );
});
