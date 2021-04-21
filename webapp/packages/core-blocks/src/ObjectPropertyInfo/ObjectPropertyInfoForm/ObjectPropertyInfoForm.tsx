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

import { InputField } from '@cloudbeaver/core-blocks';
import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { FieldCheckbox } from '../../FormControls/Checkboxes/FieldCheckbox';
import { Combobox } from '../../FormControls/Combobox';
import { FormFieldDescription } from '../../FormControls/FormFieldDescription';
import { FormGroup } from '../../FormControls/FormGroup';
import { isControlPresented } from '../../FormControls/isControlPresented';
import { Link } from '../../Link';
import { TextPlaceholder } from '../../TextPlaceholder';
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
  showRememberTip?: boolean;
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
  showRememberTip,
  onFocus,
}) {
  const href = property.features.includes('href');
  const password = property.features.includes('password');
  const checkbox = property.dataType === 'Boolean';
  const combobox = property.validValues && property.validValues.length > 0;
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

  if (showRememberTip && password && property.value) {
    description = 'Password saved';
  }

  if (checkbox) {
    return (
      <FieldCheckbox
        id={property.id}
        name={property.id!}
        state={state}
        label={property.displayName}
        title={property.description}
        disabled={disabled}
      />
    );
  }

  if (combobox) {
    return (
      <Combobox
        name={property.id!}
        state={state}
        items={property.validValues!}
        keySelector={value => value}
        valueSelector={value => value}
        defaultValue={property.defaultValue}
        mod="surface"
        title={property.description}
        disabled={disabled}
      >
        {property.displayName ?? ''}
      </Combobox>
    );
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
  state: Record<string, string | number>;
  editable?: boolean;
  autofillToken?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  autoHide?: boolean;
  showRememberTip?: boolean;
  onFocus?: (name: string) => void;
}

export const ObjectPropertyInfoForm: React.FC<ObjectPropertyFormProps> = observer(function ObjectPropertyInfoForm({
  properties,
  state,
  editable = true,
  autofillToken = '',
  className,
  disabled,
  readOnly,
  autoHide,
  showRememberTip,
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
            state={state}
            editable={editable}
            autofillToken={autofillToken}
            disabled={disabled}
            readOnly={readOnly}
            autoHide={autoHide}
            showRememberTip={showRememberTip}
            onFocus={handleFocus}
          />
        </FormGroup>
      ))}
    </form-body>
  );
});
