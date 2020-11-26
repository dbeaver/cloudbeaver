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
import { isControlPresented } from '../FormControls/isControlPresented';
import { Link } from '../Link';
import { TextPlaceholder } from '../TextPlaceholder';
import { formStyles } from './formStyles';

const RESERVED_KEYWORDS = ['no', 'off', 'new-password'];

interface RenderFieldProps {
  property: ObjectPropertyInfo;
  state: Record<string, any>;
  editable?: boolean;
  autofillToken?: string;
  disabled?: boolean;
  readOnly?: boolean;
  autoHide?: boolean;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

const RenderField: React.FC<RenderFieldProps> = observer(function RenderField({
  property,
  state,
  editable = true,
  autofillToken = '',
  disabled,
  readOnly,
  autoHide,
  onFocus,
}) {
  const href = property.features.includes('href');
  const password = property.features.includes('password');
  let description: string | undefined;

  if (href) {
    return (
      <FormFieldDescription label={property.displayName} raw>
        <Link href={state[property.id!]} target='_blank' rel='noopener noreferrer'>{property.description}</Link>
      </FormFieldDescription>
    );
  }

  if (!editable) {
    if (autoHide && !isControlPresented(property.id!, state)) {
      return null;
    }
    return (
      <FormFieldDescription label={property.displayName} raw>
        {state[property.id!]}
      </FormFieldDescription>
    );
  }

  if (password && property.value) {
    description = 'Password saved';
  }

  return (
    <InputField
      type={password ? 'password' : 'text'}
      name={property.id!}
      state={state}
      description={description}
      disabled={disabled}
      readOnly={readOnly}
      autoHide={autoHide}
      autoComplete={RESERVED_KEYWORDS.includes(autofillToken) ? autofillToken : `${autofillToken} ${property.id}`}
      mod='surface'
      onFocus={onFocus}
    >
      {property.displayName}
    </InputField>
  );
});

interface ObjectPropertyFormProps {
  properties: ObjectPropertyInfo[] | undefined;
  credentials: Record<string, string | number>;
  editable?: boolean;
  autofillToken?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  autoHide?: boolean;
  onFocus?: (name: string) => void;
}

export const ObjectPropertyInfoForm: React.FC<ObjectPropertyFormProps> = observer(function ObjectPropertyInfoForm({
  properties,
  credentials,
  editable = true,
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
  }, [onFocus]);

  if (!properties || properties.length === 0) {
    return <TextPlaceholder>Properties empty</TextPlaceholder>;
  }

  return styled(style)(
    <form-body as='div' className={className}>
      {properties.map(property => (
        <FormGroup key={property.id}>
          <RenderField
            property={property}
            state={credentials}
            editable={editable}
            autofillToken={autofillToken}
            disabled={disabled}
            readOnly={readOnly}
            autoHide={autoHide}
            onFocus={handleFocus}
          />
        </FormGroup>
      ))}
    </form-body>
  );
});
