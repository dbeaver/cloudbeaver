/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { Alert, Button, ConfirmationDialog, InputField, Loader, useClipboard, useExecutor, useFocus, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IFormProps } from '@cloudbeaver/core-ui';
import { getFirstException } from '@cloudbeaver/core-utils';

import { getAIProfileCredentialsFormParts } from './getAIProfileCredentialsFormParts.js';
import type { IAIProfileCredentialsFormState } from './IAIProfileCredentialsFormState.js';

export const AIProfileSubscriptionFields = observer<IFormProps<IAIProfileCredentialsFormState>>(function AIProfileSubscriptionFields({ formState }) {
  const translate = useTranslate();
  const copy = useClipboard();
  const userInfoResource = useService(UserInfoResource);
  const commonDialogService = useService(CommonDialogService);
  const notificationService = useService(NotificationService);
  const { subscription: part } = getAIProfileCredentialsFormParts(formState);
  const profile = part.profile;
  const blocked = formState.isDisabled || part.isOutdated();
  const authorization = part.authorization;
  const exception = getFirstException(part.exception);
  const [accountStatusRef, accountStatusFocus] = useFocus<HTMLDivElement>({});
  const [connectRef] = useFocus<HTMLDivElement>({ focusFirstChild: !!exception && !blocked });

  useExecutor({ executor: userInfoResource.onUserChange, handlers: [() => part.cancelAuthorization()] });

  async function connect(): Promise<void> {
    if (await part.connect()) {
      accountStatusFocus.reference?.focus();
      notificationService.logSuccess({ title: 'plugin_ai_account_connected', message: profile?.name });
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
    try {
      await part.disconnect();
    } catch (exception: any) {
      notificationService.logException(exception, 'plugin_ai_account_disconnect_failed');
    }
  }

  if (!profile || profile.global) {
    return null;
  }

  return (
    <>
      {(profile.account || part.isLoading()) && (
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
          <Button type="button" variant="secondary" disabled={blocked} onClick={disconnect}>
            {translate('plugin_ai_account_disconnect')}
          </Button>
        </div>
      ) : (
        <>
          {authorization && (
            <>
              <InputField value={authorization.userCode} readOnly autoFocus onCustomCopy={() => copy(authorization.userCode, true)}>
                {translate('plugin_ai_device_code')}
              </InputField>
              <a href={authorization.verificationUri} target="_blank" rel="noopener noreferrer">
                {translate('plugin_ai_device_open_provider', undefined, { provider: profile.accountProvider ?? '' })}
              </a>
              <p>{translate('plugin_ai_device_instructions')}</p>
              <p>{translate('plugin_ai_device_expiration', undefined, { minutes: Math.ceil(authorization.expiresInSeconds / 60) })}</p>
            </>
          )}
          {exception && (
            <Alert variant="error">
              {translate('plugin_ai_device_failed')}: {exception.message}
            </Alert>
          )}
          {!part.isLoading() && (
            <div key={exception && !blocked ? 'retry' : 'connect'} ref={connectRef}>
              <Button type="button" disabled={blocked || !profile.deviceAuthorizationAvailable} onClick={connect}>
                {translate(exception ? 'plugin_ai_device_retry' : 'plugin_ai_account_connect')}
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
});
