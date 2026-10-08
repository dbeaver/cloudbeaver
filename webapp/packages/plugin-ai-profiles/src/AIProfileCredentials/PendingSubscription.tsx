/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { InputField, Loader, useClipboard, useTranslate } from '@cloudbeaver/core-blocks';

import type { AIProfile } from '../AIProfilesResource.js';
import type { AIProfileAuthorizationController } from './AIProfileAuthorizationController.js';

interface Props {
  profile: AIProfile;
  controller: AIProfileAuthorizationController;
}

export const PendingSubscription = observer<Props>(function PendingSubscription({ profile, controller }) {
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
