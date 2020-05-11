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

import { InputField } from '@dbeaver/core/blocks';
import { useStyles } from '@dbeaver/core/theming';

import { AuthProvider } from '../../AuthProviderService';
import { formStyles } from './formStyles';

type Props = {
  provider: AuthProvider;
  credentials: any;
  authenticate: boolean;
}

export const AuthProviderForm = observer(function AuthProviderForm({
  provider,
  credentials,
  authenticate,
}: Props) {
  // const translate = useTranslate();
  const handleChange = useCallback((key: string, value: string) => {
    credentials[key] = value;
  }, [credentials]);

  return styled(useStyles(formStyles))(
    <>
      {provider.credentialParameters.map(parameter => parameter.user && (
        <group as="div" key={parameter.id}>
          <InputField
            type={parameter.encryption === 'none' ? 'text' : 'password'}
            name={parameter.id}
            value={credentials[parameter.id]}
            onChange={value => handleChange(parameter.id, value)}
            disabled={authenticate}
            mod='surface'
          >
            {parameter.displayName}
          </InputField>
        </group>
      ))}
    </>
  );
});
