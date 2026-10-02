/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect, useId } from 'react';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import {
  Alert,
  Button,
  ConfirmationDialog,
  Container,
  InputField,
  Loader,
  Radio,
  RadioGroup,
  SAVED_VALUE_INDICATOR,
  useClipboard,
  useExecutor,
  useFocus,
  useObservableRef,
  usePromiseState,
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { ITask } from '@cloudbeaver/core-executor';
import type { AiDeviceAuthorizationInfo } from '@cloudbeaver/core-sdk';
import { getFirstException } from '@cloudbeaver/core-utils';

import { AIProfilesResource, type IAIProfileCredentialsState } from '../AIProfilesResource.js';
import { AIProfileCredentialsService } from './AIProfileCredentialsService.js';

export interface IAIProfileCredentialsFieldsProps {
  profileId: string;
  state: IAIProfileCredentialsState;
  disabled?: boolean;
  onChange: (state: IAIProfileCredentialsState) => void;
  onProcessing: (processing: boolean) => void;
  onCredentialsChanged: (accountAuthentication: boolean) => void;
}

export const AIProfileCredentialsFields = observer<IAIProfileCredentialsFieldsProps>(function AIProfileCredentialsFields({
  profileId,
  state,
  disabled,
  onChange,
  onProcessing,
  onCredentialsChanged,
}) {
  const translate = useTranslate();
  const copy = useClipboard();
  const name = useId();
  const profiles = useResource(AIProfileCredentialsFields, AIProfilesResource, profileId);
  const credentialsService = useService(AIProfileCredentialsService);
  const userInfo = useService(UserInfoResource);
  const dialogs = useService(CommonDialogService);
  const notifications = useService(NotificationService);
  const data = useObservableRef(
    () => ({
      task: null as ITask<boolean> | null,
      authorization: null as AiDeviceAuthorizationInfo | null,
      cancel(): void {
        if (this.task?.executing) {
          void this.task.cancel()?.catch(exception => notifications.logException(exception, 'plugin_ai_device_cancel_failed'));
        }
      },
    }),
    {
      task: observable.ref,
      authorization: observable.ref,
    },
    false,
    ['cancel'],
  );
  const profile = profiles.data;
  const accountAuthentication = !!profile?.accountProvider && state.accountAuthentication;
  const taskState = usePromiseState(data.task);
  const exception = taskState.isCancelled?.() ? null : getFirstException(taskState.exception);
  const [accountStatusRef, accountStatusFocus] = useFocus<HTMLDivElement>({});
  const blocked = disabled || taskState.isLoading() || profiles.isOutdated();
  const [connectRef] = useFocus<HTMLDivElement>({ focusFirstChild: !!exception && !blocked });

  useExecutor({ executor: userInfo.onUserChange, handlers: [data.cancel] });

  useEffect(() => data.cancel, [data]);

  async function connect(): Promise<void> {
    if (disabled || !profile?.accountProvider || data.task?.executing) {
      return;
    }
    data.task = null;
    onProcessing(true);
    try {
      const task = credentialsService.authorize(profileId, info => {
        data.authorization = info;
      });
      data.task = task;
      if ((await task) && !task.cancelled) {
        accountStatusFocus.reference?.focus();
        onCredentialsChanged(true);
        notifications.logSuccess({ title: 'plugin_ai_account_connected', message: profile?.name });
      }
    } catch (error: any) {
      // Task failures are exposed by usePromiseState; report errors creating the task separately.
      if (!data.task) {
        notifications.logException(error, 'plugin_ai_device_failed');
      }
    } finally {
      data.authorization = null;
      onProcessing(false);
    }
  }

  async function removeCredentials(account: boolean): Promise<void> {
    const { status } = await dialogs.open(ConfirmationDialog, {
      title: translate(account ? 'plugin_ai_account_disconnect' : 'plugin_ai_credentials_reset_title'),
      message: account ? 'plugin_ai_account_disconnect_confirmation' : 'plugin_ai_credentials_reset_confirmation',
      confirmActionText: account ? 'plugin_ai_account_disconnect' : 'plugin_ai_credentials_reset',
    });
    if (status !== DialogueStateResult.Resolved) {
      return;
    }
    try {
      onProcessing(true);
      if (account) {
        await profiles.resource.disconnectAccount(profileId);
      } else {
        await profiles.resource.resetCredentials(profileId);
      }
      onCredentialsChanged(!!profile?.accountProvider && profile.accountAuthentication);
    } catch (exception: any) {
      notifications.logException(exception, account ? 'plugin_ai_account_disconnect_failed' : 'plugin_ai_credentials_reset_failed');
    } finally {
      onProcessing(false);
    }
  }

  if (!profile || profile.global) {
    return null;
  }

  return (
    <Container vertical gap>
      {!!profile.accountProvider && (
        <RadioGroup
          name={name}
          label={translate('plugin_ai_credentials_method')}
          value={accountAuthentication ? 'subscription' : 'token'}
          onChange={value => onChange({ ...state, accountAuthentication: value === 'subscription' })}
        >
          <Radio name={name} value="token" disabled={blocked} keepSize>
            {translate('plugin_ai_credentials_token')}
          </Radio>
          <Radio name={name} value="subscription" disabled={blocked} keepSize>
            {translate('plugin_ai_credentials_account', undefined, { provider: profile.accountProvider })}
          </Radio>
        </RadioGroup>
      )}
      {!accountAuthentication ? (
        <>
          <InputField
            value={state.token}
            type="password"
            name="token"
            autoComplete="new-password"
            required={!profile.tokenSaved}
            disabled={blocked}
            placeholder={profile.tokenSaved ? SAVED_VALUE_INDICATOR : undefined}
            description={profile.tokenSaved ? translate('ui_processing_saved') : undefined}
            onChange={token => onChange({ ...state, token, accountAuthentication: false })}
          >
            {translate('plugin_ai_credentials_token')}
          </InputField>
          {profile.tokenSaved && (
            <div>
              <Button type="button" variant="secondary" disabled={blocked} onClick={() => removeCredentials(false)}>
                {translate('plugin_ai_credentials_reset')}
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          {(profile.account || taskState.isLoading()) && (
            <div ref={accountStatusRef} role="status" tabIndex={-1}>
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
            <div>
              <Button type="button" variant="secondary" disabled={blocked} onClick={() => removeCredentials(true)}>
                {translate('plugin_ai_account_disconnect')}
              </Button>
            </div>
          ) : (
            <>
              {data.authorization && (
                <>
                  <InputField value={data.authorization.userCode} readOnly autoFocus onCustomCopy={() => copy(data.authorization!.userCode, true)}>
                    {translate('plugin_ai_device_code')}
                  </InputField>
                  <a href={data.authorization.verificationUri} target="_blank" rel="noopener noreferrer">
                    {translate('plugin_ai_device_open_provider', undefined, { provider: profile.accountProvider ?? '' })}
                  </a>
                  <p>{translate('plugin_ai_device_instructions')}</p>
                  <p>{translate('plugin_ai_device_expiration', undefined, { minutes: Math.ceil(data.authorization.expiresInSeconds / 60) })}</p>
                </>
              )}
              {exception && (
                <Alert variant="error">
                  {translate('plugin_ai_device_failed')}: {exception.message}
                </Alert>
              )}
              {!taskState.isLoading() && (
                <div key={exception && !blocked ? 'retry' : 'connect'} ref={connectRef}>
                  <Button type="button" disabled={blocked || !profile.accountProvider} onClick={connect}>
                    {translate(exception ? 'plugin_ai_device_retry' : 'plugin_ai_account_connect')}
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </Container>
  );
});
