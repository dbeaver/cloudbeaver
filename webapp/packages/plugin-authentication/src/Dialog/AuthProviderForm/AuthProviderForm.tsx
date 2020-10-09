/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';
import styled from 'reshadow';

import { AuthProvider } from '@cloudbeaver/core-authentication';
import { InputField, useFocus } from '@cloudbeaver/core-blocks';
import { useStyles } from '@cloudbeaver/core-theming';

import { formStyles } from './formStyles';

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
  const handleChange = useCallback((key: string, value: string) => {
    credentials[key] = value;
  }, [credentials]);

  return styled(useStyles(formStyles))(
    <login-form ref={elementRef} as='div'>
      {provider.credentialParameters.map(parameter => parameter.user && (
        <group key={parameter.id} as="div">
          <InputField
            type={parameter.encryption === 'none' ? 'text' : 'password'}
            name={`authentication_${provider.id}_${parameter.id}`}
            value={credentials[parameter.id]}
            disabled={authenticate}
            autoComplete={`section-authentication section-${provider.id} ${parameter.id}`}
            mod='surface'
            onChange={value => handleChange(parameter.id, value)}
          >
            {parameter.displayName}
          </InputField>
        </group>
      ))}
    </login-form>
  );
});
