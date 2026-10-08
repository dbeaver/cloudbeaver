/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useId } from 'react';

import { Container, InputField, Radio, RadioGroup, useAutoLoad, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { AiEnginesResource } from '@cloudbeaver/plugin-ai';
import type { IFormProps } from '@cloudbeaver/core-ui';

import { getAIProfileCredentialsFormPart } from './getAIProfileCredentialsFormPart.js';
import { getAIProfileAuthorizationController } from './getAIProfileAuthorizationController.js';
import { AIProfilesResource } from '../AIProfilesResource.js';
import type { IAIProfileCredentialsFormState } from './IAIProfileCredentialsFormState.js';
import { AIProfileTokenFields } from './AIProfileTokenFields.js';
import { AIProfileSubscriptionFields } from './AIProfileSubscriptionFields.js';

export const AIProfileCredentialsFields = observer<IFormProps<IAIProfileCredentialsFormState>>(function AIProfileCredentialsFields({ formState }) {
  const translate = useTranslate();
  const name = useId();
  const part = getAIProfileCredentialsFormPart(formState);
  const profiles = useService(AIProfilesResource);
  const engines = useService(AiEnginesResource);
  const controller = getAIProfileAuthorizationController(formState);
  const profile = profiles.get(formState.state.profileId);

  useAutoLoad(AIProfileCredentialsFields, part);

  if (!profile) {
    return null;
  }

  const engine = engines.data.find(engine => engine.id === profile.engineId);
  const accountAuthentication = profile.deviceAuthorizationAvailable && part.state.accountAuthentication;

  return (
    <Container vertical gap>
      <InputField value={profile.name} readOnly>
        {translate('plugin_ai_credentials_profile')}
      </InputField>
      <InputField value={engine?.name ?? profile.engineId} readOnly>
        {translate('plugin_ai_credentials_engine')}
      </InputField>
      {profile.deviceAuthorizationAvailable && !profile.global && (
        <RadioGroup
          name={name}
          label={translate('plugin_ai_credentials_method')}
          value={accountAuthentication ? 'subscription' : 'token'}
          onChange={async value => {
            if (!(await controller.confirmLeave())) {
              return;
            }
            part.state.accountAuthentication = value === 'subscription';
          }}
        >
          <Radio name={name} value="token" disabled={formState.isDisabled} keepSize>
            {translate('plugin_ai_credentials_token')}
          </Radio>
          <Radio name={name} value="subscription" disabled={formState.isDisabled} keepSize>
            {profile.accountProvider
              ? translate('plugin_ai_credentials_account', undefined, { provider: profile.accountProvider })
              : translate('plugin_ai_credentials_subscription')}
          </Radio>
        </RadioGroup>
      )}
      {accountAuthentication ? (
        <AIProfileSubscriptionFields formState={formState} profile={profile} />
      ) : (
        <AIProfileTokenFields formState={formState} profile={profile} />
      )}
    </Container>
  );
});
