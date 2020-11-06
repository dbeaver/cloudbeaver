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

import { InputField } from '@cloudbeaver/core-blocks';
import { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { FormFieldDescription } from '../FormControls/FormFieldDescription';
import { FormGroup } from '../FormControls/FormGroup';
import { Link } from '../Link';
import { TextPlaceholder } from '../TextPlaceholder';
import { formStyles } from './formStyles';

interface Props {
  properties: ObjectPropertyInfo[] | undefined;
  credentials: Record<string, string | number>;
  autofillToken?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  autoHide?: boolean;
  onFocus?: (name: string) => void;
}

const RESERVED_KEYWORDS = ['no', 'off', 'new-password'];

export const ObjectPropertyInfoForm: React.FC<Props> = observer(function ObjectPropertyInfoForm({
  properties,
  credentials,
  autofillToken = '',
  className,
  disabled,
  readOnly,
  autoHide,
  onFocus,
}) {
  const style = useStyles(formStyles);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (onFocus) {
      onFocus(e.target.name);
    }
    if (e.target.type !== 'password') {
      return;
    }

    const property = properties?.find(property => property.id === e.target.name);

    if (property?.value === e.target.value) {
      credentials[e.target.name] = '';
    }
  }, [properties, credentials, onFocus]);

  if (!properties || properties.length === 0) {
    return <TextPlaceholder>Properties empty</TextPlaceholder>;
  }

  return styled(style)(
    <form-body as='div' className={className}>
      {properties.map(property => (
        <FormGroup key={property.id}>
          {property.features.includes('href') ? (
            <FormFieldDescription label={property.displayName} raw>
              <Link href={property.value} target='_blank' rel='noopener noreferrer'>{property.description}</Link>
            </FormFieldDescription>
          ) : (
            <InputField
              type={property.features.includes('password') ? 'password' : 'text'}
              name={property.id!}
              state={credentials}
              disabled={disabled}
              readOnly={readOnly}
              autoHide={autoHide}
              autoComplete={RESERVED_KEYWORDS.includes(autofillToken) ? autofillToken : `${autofillToken} ${property.id}`}
              mod='surface'
              onFocus={handleFocus}
            >
              {property.displayName}
            </InputField>
          )}
        </FormGroup>
      ))}
    </form-body>
  );
});
