/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { Button, ConfirmationDialog, Container, InputField, Loader, useClipboard, useExecutor, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { AsyncTask } from '@cloudbeaver/core-root';
import type { AiDeviceAuthorizationInfo } from '@cloudbeaver/core-sdk';
import type { IFormProps } from '@cloudbeaver/core-ui';

import { AIProfilesResource } from '../AIProfilesResource.js';
import { AIProfileCredentialsService } from './AIProfileCredentialsService.js';
import { getAIProfileCredentialsFormPart } from './getAIProfileCredentialsFormPart.js';
import type { IAIProfileCredentialsFormState } from './IAIProfileCredentialsFormState.js';

export const AIProfileSubscriptionFields = observer<IFormProps<IAIProfileCredentialsFormState>>(function AIProfileSubscriptionFields({ formState }) {
  const translate = useTranslate();
  const copy = useClipboard();
  const userInfoResource = useService(UserInfoResource);
  const commonDialogService = useService(CommonDialogService);
  const notificationService = useService(NotificationService);
  const credentialsService = useService(AIProfileCredentialsService);
  const aiProfilesResource = useService(AIProfilesResource);
  const part = getAIProfileCredentialsFormPart(formState);
  const profile = part.currentProfile;
  const [processing, setProcessing] = useState(false);
  const [authorization, setAuthorization] = useState<AiDeviceAuthorizationInfo | null>(null);
  const taskRef = useRef<AsyncTask | null>(null);
  const blocked = formState.isDisabled || processing;

  function cancelAuthorization(): Promise<void> | undefined {
    if (taskRef.current) {
      return credentialsService.cancelAuthorization(taskRef.current);
    }
    return undefined;
  }

  useExecutor({ executor: userInfoResource.onUserChange, handlers: [cancelAuthorization] });
  useEffect(
    () => () => {
      if (taskRef.current) {
        void credentialsService.cancelAuthorization(taskRef.current);
      }
    },
    [credentialsService],
  );

  async function connect(): Promise<void> {
    setProcessing(true);
    const task = credentialsService.authorize(formState.state.profileId, setAuthorization);
    taskRef.current = task;
    try {
      if (await credentialsService.connect(formState.state.profileId, task)) {
        notificationService.logSuccess({ title: 'plugin_ai_account_connected', message: profile?.name });
      }
    } catch (exception: any) {
      if (!task.cancelled) {
        notificationService.logException(exception, 'plugin_ai_device_failed');
      }
    } finally {
      taskRef.current = null;
      setAuthorization(null);
      setProcessing(false);
    }
  }

  async function disconnect(): Promise<void> {
    const { status } = await commonDialogService.open(ConfirmationDialog, {
      title: translate('plugin_ai_account_disconnect'),
      message: 'plugin_ai_account_disconnect_confirmation',
      confirmActionText: 'plugin_ai_account_disconnect',
    });
    if (status !== DialogueStateResult.Resolved) {
      return;
    }
    setProcessing(true);
    try {
      await aiProfilesResource.disconnectAccount(formState.state.profileId);
      notificationService.logSuccess({ title: 'plugin_ai_account_disconnected', message: profile?.name });
    } catch (exception: any) {
      notificationService.logException(exception, 'plugin_ai_account_disconnect_failed');
    } finally {
      setProcessing(false);
    }
  }

  if (!profile) {
    return null;
  }

  return (
    <>
      {(profile.account || processing) && (
        <div role="status">
          {profile.account ? (
            <>
              {translate('plugin_ai_account_connected')}
              {profile.account.email ? `: ${profile.account.email}` : ''}
            </>
          ) : (
            <Loader message="plugin_ai_device_waiting" hideMessage={false} inline small />
          )}
        </div>
      )}
      {profile.account ? (
        <Container className="tw:self-start" keepSize>
          <Button type="button" variant="secondary" disabled={blocked} onClick={disconnect}>
            {translate('plugin_ai_account_disconnect')}
          </Button>
        </Container>
      ) : (
        <>
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
          {!processing && (
            <Container className="tw:self-start" keepSize>
              <Button type="button" disabled={blocked || !profile.deviceAuthorizationAvailable} onClick={connect}>
                {translate('plugin_ai_account_connect')}
              </Button>
            </Container>
          )}
        </>
      )}
    </>
  );
});
