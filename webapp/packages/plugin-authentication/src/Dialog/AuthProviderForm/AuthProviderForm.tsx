/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import styled from 'reshadow';

import type { AuthProvider } from '@cloudbeaver/core-authentication';
import { BASE_CONTAINERS_STYLES, Group, InputFieldNew, useFocus } from '@cloudbeaver/core-blocks';
import { useStyles } from '@cloudbeaver/core-theming';

interface Props {
  provider: AuthProvider;
  credentials: any;
  authenticate: boolean;
}

export const AuthProviderForm = observer(function AuthProviderForm({
  provider,
  credentials,
  authenticate,
}: Props) {
  const [elementRef] = useFocus<HTMLDivElement>({ focusFirstChild: true });
  const handleChange = useCallback((key: string, value: string | number) => {
    credentials[key] = value;
  }, [credentials]);

  return styled(useStyles(BASE_CONTAINERS_STYLES))(
    <Group ref={elementRef} gap small center>
      {provider.credentialParameters.map(parameter => parameter.user && (
        <InputFieldNew
          key={parameter.id}
          title={parameter.description}
          type={parameter.encryption === 'none' ? 'text' : 'password'}
          name={`authentication_${provider.id}_${parameter.id}`}
          value={credentials[parameter.id]}
          disabled={authenticate}
          autoComplete={`section-authentication section-${provider.id} ${parameter.id}`}
          mod='surface'
          onChange={value => handleChange(parameter.id, value)}
        >
          {parameter.displayName}
        </InputFieldNew>
      ))}
    </Group>
  );
});
