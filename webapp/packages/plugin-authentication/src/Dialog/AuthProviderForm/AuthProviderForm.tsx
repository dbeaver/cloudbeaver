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

interface Props {
  provider: AuthProvider;
  configuration: AuthProviderConfiguration | null;
  credentials: IAuthCredentials;
  authenticate: boolean;
}

export const AuthProviderForm = observer<Props>(function AuthProviderForm({ provider, configuration, credentials, authenticate }) {
  const [elementRef] = useFocus<HTMLDivElement>({ focusFirstChild: true });

  function handleProfileSelect() {
    credentials.credentials = {};
  }

  const profile = provider.credentialProfiles[credentials.profile as any as number]!;

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
      {profile.credentialParameters.map(
        parameter =>
          parameter.user && (
            <InputField
              key={`${provider.id}${configuration?.id ?? ''}${parameter.id}`}
              required={provider.required}
              title={parameter.description}
              type={parameter.encryption === 'none' ? 'text' : 'password'}
              name={parameter.id}
              state={credentials.credentials}
              readOnly={authenticate}
              canShowPassword={false}
              autoComplete={`section-authentication section-${provider.id} ${configuration?.id ?? ''} ${parameter.id}`}
            >
              {parameter.displayName}
            </InputField>
          ),
      )}
    </Group>
  );
});
