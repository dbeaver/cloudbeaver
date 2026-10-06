/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useId } from 'react';

import { Container, InputField, Radio, RadioGroup, useAutoLoad, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import type { IFormProps } from '@cloudbeaver/core-ui';
import { AiEnginesResource } from '@cloudbeaver/plugin-ai';

import { getAIProfileCredentialsFormParts } from './getAIProfileCredentialsFormParts.js';
import type { IAIProfileCredentialsFormState } from './IAIProfileCredentialsFormState.js';
import { AIProfileTokenFields } from './AIProfileTokenFields.js';
import { AIProfileSubscriptionFields } from './AIProfileSubscriptionFields.js';

export const AIProfileCredentialsFields = observer<IFormProps<IAIProfileCredentialsFormState>>(function AIProfileCredentialsFields({ formState }) {
  const translate = useTranslate();
  const name = useId();
  const { token, subscription } = getAIProfileCredentialsFormParts(formState);
  useAutoLoad(AIProfileCredentialsFields, [token, subscription]);
  const aiEnginesResource = useResource(AIProfileCredentialsFields, AiEnginesResource, undefined);
  const profile = token.profile;
  const blocked = formState.isDisabled || token.isOutdated();

  return (
    <Container vertical gap>
      <InputField value={profile?.name ?? ''} disabled={formState.isDisabled} readOnly>
        {translate('plugin_ai_credentials_profile')}
      </InputField>
      <InputField value={aiEnginesResource.data?.find(engine => engine.id === profile?.engineId)?.name ?? profile?.engineId ?? ''} readOnly>
        {translate('plugin_ai_credentials_engine')}
      </InputField>
      {profile?.deviceAuthorizationAvailable && !profile.global && (
        <RadioGroup
          name={name}
          label={translate('plugin_ai_credentials_method')}
          value={subscription.accountAuthentication ? 'subscription' : 'token'}
          onChange={value => {
            subscription.state.accountAuthentication = value === 'subscription';
          }}
        >
          <Radio name={name} value="token" disabled={blocked} keepSize>
            {translate('plugin_ai_credentials_token')}
          </Radio>
          <Radio name={name} value="subscription" disabled={blocked} keepSize>
            {profile.accountProvider
              ? translate('plugin_ai_credentials_account', undefined, { provider: profile.accountProvider })
              : translate('plugin_ai_credentials_subscription')}
          </Radio>
        </RadioGroup>
      )}
      {subscription.accountAuthentication ? <AIProfileSubscriptionFields formState={formState} /> : <AIProfileTokenFields formState={formState} />}
    </Container>
  );
});
