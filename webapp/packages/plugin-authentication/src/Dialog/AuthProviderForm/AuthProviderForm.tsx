/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import type { AuthProvider, IAuthCredentials } from '@cloudbeaver/core-authentication';
import { BASE_CONTAINERS_STYLES, Combobox, Group, InputField, useFocus } from '@cloudbeaver/core-blocks';
import { useStyles } from '@cloudbeaver/core-theming';

interface Props {
  provider: AuthProvider;
  credentials: IAuthCredentials;
  authenticate: boolean;
}

export const AuthProviderForm = observer<Props>(function AuthProviderForm({
  provider,
  credentials,
  authenticate,
}) {
  const [elementRef] = useFocus<HTMLDivElement>({ focusFirstChild: true });

  function handleProfileSelect() {
    credentials.credentials = {};
  }

  const profile = provider.credentialProfiles[credentials.profile as any as number];

  return styled(useStyles(BASE_CONTAINERS_STYLES))(
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
      {profile.credentialParameters.map(parameter => parameter.user && (
        <InputField
          key={parameter.id}
          title={parameter.description}
          type={parameter.encryption === 'none' ? 'text' : 'password'}
          name={parameter.id}
          state={credentials.credentials}
          disabled={authenticate}
          autoComplete={`section-authentication section-${provider.id} ${parameter.id}`}
          mod='surface'
        >
          {parameter.displayName}
        </InputField>
      ))}
    </Group>
  );
});
