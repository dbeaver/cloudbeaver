/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Container, Group, InputField, useAutoLoad, useTranslate } from '@cloudbeaver/core-blocks';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { AIProfileCredentialsFields as CredentialsFields } from '@cloudbeaver/plugin-ai-profiles';

import { getAIProfileCredentialsFormPart } from '../AIProfileCredentialsForm/getAIProfileCredentialsFormPart.js';
import type { IAIProfileCredentialsFormProps } from '../AIProfileCredentialsForm/IAIProfileCredentialsFormProps.js';

export const AIProfileCredentialsFields: TabContainerPanelComponent<IAIProfileCredentialsFormProps> = observer(function AIProfileCredentialsFields({
  formState,
  credentialsProcessing,
  onProcessing,
}) {
  const translate = useTranslate();
  const part = getAIProfileCredentialsFormPart(formState);

  useAutoLoad(AIProfileCredentialsFields, part);

  return (
    <Group className="tw:w-full" small keepSize gap>
      <Container vertical gap>
        <InputField value={part.state.profileName} disabled={formState.isDisabled} readOnly>
          {translate('plugin_ai_credentials_profile')}
        </InputField>
        <InputField value={part.state.engineName} disabled={formState.isDisabled} readOnly>
          {translate('plugin_ai_credentials_engine')}
        </InputField>
        {part.isLoaded() && (
          <CredentialsFields
            key={formState.state.profileId}
            profileId={formState.state.profileId}
            state={part.state}
            disabled={formState.isDisabled || credentialsProcessing}
            onChange={state => Object.assign(part.state, state)}
            onProcessing={onProcessing}
            onCredentialsChanged={accountAuthentication => part.credentialsChanged(accountAuthentication)}
          />
        )}
      </Container>
    </Group>
  );
});
