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
  properties: ObjectPropertyInfo[] | undefined;
  credentials: any;
  processing: boolean;
  prefix?: string;
  autofillToken?: string;
  className?: string;
}

export const ObjectPropertyInfoForm = observer(function ObjectPropertyInfoForm({
  properties,
  credentials,
  processing,
  prefix = '',
  autofillToken = '',
  className,
}: Props) {
  const handleChange = useCallback((key: string, value: string) => {
    credentials[key] = value;
  }, [credentials]);

  if (!properties || properties.length === 0) {
    return styled(useStyles(formStyles))(<center as="div">Properties empty</center>);
  }

  return styled(useStyles(formStyles))(
    <InFocus>
      <form-body as='div' className={className}>
        {properties.map(property => (
          <group as="div" key={property.id}>
            <InputField
              type={property.features.includes('password') ? 'password' : 'text'}
              name={`${prefix}_${property.id}`}
              value={credentials[property.id!]}
              onChange={value => handleChange(property.id!, value)}
              disabled={processing}
              autoComplete={`${autofillToken} ${property.id}`}
              mod='surface'
            >
              {property.displayName}
            </InputField>
          </group>
        ))}
      </form-body>
    </InFocus>
  );
});
