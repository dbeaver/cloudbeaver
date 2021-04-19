/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

import { FieldCheckboxNew } from '../../FormControls/Checkboxes/FieldCheckboxNew';
import { ComboboxNew } from '../../FormControls/ComboboxNew';
import { FormFieldDescriptionNew } from '../../FormControls/FormFieldDescriptionNew';
import { InputFieldNew } from '../../FormControls/InputFieldNew';
import { isControlPresented } from '../../FormControls/isControlPresented';
import { Link } from '../../Link';

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
  className?: string;
}

function isCheckbox(property: ObjectPropertyInfo) {
  return property.dataType?.toLowerCase() === 'boolean';
}

function getDefaultValueFor(property: ObjectPropertyInfo) {
  const checkbox = isCheckbox(property);
  const value = property.value;

  if (value === null || value === undefined) {
    return checkbox ? false : '';
  }

  if (typeof value === 'string') {
    return checkbox ? value === 'true' : value;
  }

  return value.displayName || value.value || JSON.stringify(value);
}

export const RenderField: React.FC<RenderFieldProps> = observer(function RenderField({
  property,
  state,
  editable = true,
  autofillToken = '',
  disabled,
  readOnly,
  autoHide,
  showRememberTip,
  onFocus,
  className,
}) {
  const href = property.features.includes('href');
  const password = property.features.includes('password');
  const checkbox = isCheckbox(property);
  const combobox = property.validValues && property.validValues.length > 0;
  const defaultValue = getDefaultValueFor(property);
  let description: string | undefined;

  if (href) {
    return (
      <FormFieldDescriptionNew label={property.displayName} className={className}>
        <Link href={state[property.id!]} target='_blank' rel='noopener noreferrer'>{property.description}</Link>
      </FormFieldDescriptionNew>
    );
  }

  if (!editable) {
    if (autoHide && !isControlPresented(property.id!, state)) {
      return null;
    }
    return (
      <FormFieldDescriptionNew title={property.description} label={property.displayName} className={className}>
        {state[property.id!]}
      </FormFieldDescriptionNew>
    );
  }

  if (showRememberTip && password && property.value) {
    description = 'Password saved';
  }

  if (checkbox) {
    return (
      <FieldCheckboxNew
        name={property.id!}
        state={state}
        defaultChecked={defaultValue}
        title={property.description}
        disabled={disabled || readOnly}
        className={className}
      >
        {property.displayName ?? ''}
      </FieldCheckboxNew>
    );
  }

  if (combobox) {
    return (
      <ComboboxNew
        name={property.id!}
        state={state}
        items={property.validValues!}
        keySelector={value => value}
        valueSelector={value => value}
        defaultValue={property.defaultValue}
        title={property.description}
        disabled={disabled}
        className={className}
      >
        {property.displayName ?? ''}
      </ComboboxNew>
    );
  }

  return (
    <InputFieldNew
      type={password ? 'password' : 'text'}
      title={property.description}
      name={property.id!}
      state={state}
      defaultValue={defaultValue}
      description={description}
      disabled={disabled}
      readOnly={readOnly}
      autoHide={autoHide}
      autoComplete={RESERVED_KEYWORDS.includes(autofillToken) ? autofillToken : `${autofillToken} ${property.id}`}
      mod='surface'
      className={className}
      onFocus={onFocus}
    >
      {property.displayName}
    </InputFieldNew>
  );
});
