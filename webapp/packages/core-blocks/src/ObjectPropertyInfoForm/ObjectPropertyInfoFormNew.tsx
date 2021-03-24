/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps';
import { FieldCheckboxNew } from '../FormControls/Checkboxes/FieldCheckboxNew';
import { ComboboxNew } from '../FormControls/ComboboxNew';
import { FormFieldDescriptionNew } from '../FormControls/FormFieldDescriptionNew';
import { InputFieldNew } from '../FormControls/InputFieldNew';
import { isControlPresented } from '../FormControls/isControlPresented';
import { Link } from '../Link';
import { TextPlaceholder } from '../TextPlaceholder';

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
  className,
}) {
  const href = property.features.includes('href');
  const password = property.features.includes('password');
  const checkbox = property.dataType === 'Boolean';
  const combobox = property.validValues && property.validValues.length > 0;
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
      <FormFieldDescriptionNew label={property.displayName} className={className}>
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
      name={property.id!}
      state={state}
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

interface ObjectPropertyFormProps extends ILayoutSizeProps {
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

export const ObjectPropertyInfoFormNew: React.FC<ObjectPropertyFormProps> = observer(function ObjectPropertyInfoFormNew({
  properties,
  state,
  editable = true,
  className,
  autofillToken = '',
  disabled,
  readOnly,
  autoHide,
  showRememberTip,
  onFocus,
}) {
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (onFocus) {
      onFocus(e.target.name);
    }
  }, [onFocus]);

  if (!properties || properties.length === 0) {
    return <TextPlaceholder>Properties empty</TextPlaceholder>;
  }

  return (
    <>
      {properties.map(property => (
        <RenderField
          key={property.id}
          className={className}
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
      ))}
    </>
  );
});
