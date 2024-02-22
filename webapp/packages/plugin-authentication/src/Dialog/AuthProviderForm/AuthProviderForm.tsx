/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { AuthProvider, AuthProviderConfiguration, IAuthCredentials } from '@cloudbeaver/core-authentication';
import { Combobox, Group, InputField, useFocus } from '@cloudbeaver/core-blocks';
import { isNotNullDefined } from '@cloudbeaver/core-utils';

interface Props {
  provider: AuthProvider;
  configuration: AuthProviderConfiguration | null;
  credentials: IAuthCredentials;
  authenticate: boolean;
}

type GenerateAutoCompleteArgs = {
  parameterId: string;
  isPassword: boolean;
  isLocalAuth: boolean;
  providerId: string;
  configurationId: string | undefined;
};

function generateAutoComplete({ parameterId, isPassword, isLocalAuth, providerId, configurationId }: GenerateAutoCompleteArgs) {
  if (isLocalAuth) {
    return;
  }

  return isPassword ? 'new-password' : `section-authentication-section-${providerId}-${parameterId}${configurationId ? `-${configurationId}` : ''}`;
}

export const AuthProviderForm = observer<Props>(function AuthProviderForm({ provider, configuration, credentials, authenticate }) {
  const [elementRef] = useFocus<HTMLDivElement>({ focusFirstChild: true });
  const isLocalAuth = !isNotNullDefined(configuration);

  function handleProfileSelect() {
    credentials.credentials = {};
  }

  const profile = provider.credentialProfiles[credentials.profile as any as number];

  return (
    <Group ref={elementRef} gap small center>
      {provider.credentialProfiles.length > 1 && (
        <Combobox
          name="profile"
          state={credentials}
          items={provider.credentialProfiles}
          keySelector={(value, index) => index + ''}
          valueSelector={value => value.label!}
          titleSelector={value => value.description}
          defaultValue="0"
          disabled={authenticate}
          onSelect={handleProfileSelect}
        />
      )}
      {profile.credentialParameters.map(parameter => {
        const isPassword = parameter.encryption !== 'none';

        return (
          parameter.user && (
            <InputField
              key={`${provider.id}${configuration?.id ?? ''}${parameter.id}`}
              required={provider.required}
              title={parameter.description}
              type={isPassword ? 'password' : 'text'}
              name={parameter.id}
              state={credentials.credentials}
              disabled={authenticate}
              canShowPassword={false}
              autoComplete={generateAutoComplete({
                parameterId: parameter.id,
                isPassword,
                isLocalAuth,
                providerId: provider.id,
                configurationId: configuration?.id,
              })}
            >
              {parameter.displayName}
            </InputField>
          )
        );
      })}
    </Group>
  );
});
