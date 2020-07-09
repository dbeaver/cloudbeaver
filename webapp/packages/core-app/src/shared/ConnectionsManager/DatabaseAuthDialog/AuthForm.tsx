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

import { InputField, InFocus } from '@cloudbeaver/core-blocks';
import { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { formStyles } from './formStyles';

type Props = {
  authProperties: ObjectPropertyInfo[] | undefined;
  credentials: any;
  authenticate: boolean;
}

export const AuthForm = observer(function AuthForm({
  authProperties,
  credentials,
  authenticate,
}: Props) {
  const handleChange = useCallback((key: string, value: string) => {
    credentials[key] = value;
  }, [credentials]);

  if (!authProperties || authProperties.length === 0) {
    return styled(useStyles(formStyles))(<center as="div">Properties empty</center>);
  }

  return styled(useStyles(formStyles))(
    <InFocus>
      <login-form as='div'>
        {authProperties.map(property => (
          <group as="div" key={property.id}>
            <InputField
              type={property.features.includes('password') ? 'password' : 'text'}
              name={property.id}
              value={credentials[property.id!]}
              onChange={value => handleChange(property.id!, value)}
              disabled={authenticate}
              mod='surface'
            >
              {property.displayName}
            </InputField>
          </group>
        ))}
      </login-form>
    </InFocus>
  );
});
