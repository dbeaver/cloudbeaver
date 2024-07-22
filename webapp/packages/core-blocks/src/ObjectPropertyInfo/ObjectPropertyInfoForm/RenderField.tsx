/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { getObjectPropertyType, getObjectPropertyValueType, type ObjectPropertyInfo, type ObjectPropertyType } from '@cloudbeaver/core-sdk';
import { removeMetadataFromDataURL } from '@cloudbeaver/core-utils';

import { FieldCheckbox } from '../../FormControls/Checkboxes/FieldCheckbox';
import { Combobox } from '../../FormControls/Combobox';
import { FormFieldDescription } from '../../FormControls/FormFieldDescription';
import { InputField } from '../../FormControls/InputField/InputField';
import { InputFileTextContent } from '../../FormControls/InputFileTextContent';
import { isControlPresented } from '../../FormControls/isControlPresented';
import { Textarea } from '../../FormControls/Textarea';
import { Link } from '../../Link';
import { useTranslate } from '../../localization/useTranslate';

const RESERVED_KEYWORDS = ['no', 'off', 'new-password'];

interface RenderFieldProps {
  property: ObjectPropertyInfo;
  state?: Record<string, any>;
  defaultState?: Record<string, any>;
  editable?: boolean;
  autofillToken?: string;
  disabled?: boolean;
  readOnly?: boolean;
  autoHide?: boolean;
  showRememberTip?: boolean;
  saved?: boolean;
  className?: string;
  canShowPassword?: boolean;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

function getValue(value: any, controlType: ObjectPropertyType) {
  const checkbox = controlType === 'checkbox';

  if (value === null || value === undefined) {
    return checkbox ? false : '';
  }

  if (typeof value === 'string') {
    return checkbox ? value.toLowerCase() === 'true' : value;
  }

  return value.displayName || value.value || JSON.stringify(value);
}

export const RenderField = observer<RenderFieldProps>(function RenderField({
  property,
  state,
  defaultState,
  editable = true,
  autofillToken = '',
  disabled,
  readOnly,
  autoHide,
  showRememberTip,
  saved,
  className,
  canShowPassword,
  onFocus,
}) {
  const translate = useTranslate();

  const controlType = getObjectPropertyType(property);
  const type = getObjectPropertyValueType(property);
  const isPassword = type === 'password';
  const required = property.required && !readOnly;

  const value = getValue(property.value, controlType);
  const defaultValue = getValue(property.defaultValue, controlType);

  if (controlType === 'link') {
    return (
      <FormFieldDescription label={property.displayName} className={className}>
        <Link href={state?.[property.id!]} target="_blank" rel="noopener noreferrer">
          {property.description}
        </Link>
      </FormFieldDescription>
    );
  }

  if (!editable) {
    if (autoHide && !isControlPresented(property.id, state)) {
      return null;
    }
    return (
      <FormFieldDescription title={property.description} label={property.displayName} className={className}>
        {state?.[property.id!]}
      </FormFieldDescription>
    );
  }

  if (controlType === 'checkbox') {
    if (state !== undefined) {
      return (
        <FieldCheckbox
          required={required}
          id={property.id}
          name={property.id!}
          state={state}
          defaultChecked={defaultValue}
          title={property.description}
          disabled={disabled || readOnly}
          className={className}
          groupGap
        >
          {property.displayName ?? ''}
        </FieldCheckbox>
      );
    }
    return (
      <FieldCheckbox
        id={property.id}
        name={property.id!}
        checked={value}
        defaultChecked={defaultValue}
        title={property.description}
        disabled={disabled || readOnly}
        className={className}
        groupGap
      >
        {property.displayName ?? ''}
      </FieldCheckbox>
    );
  }

  if (controlType === 'selector') {
    if (state !== undefined) {
      return (
        <Combobox
          required={required}
          name={property.id!}
          state={state}
          items={property.validValues!}
          keySelector={value => value}
          valueSelector={value => value}
          defaultValue={defaultValue}
          title={property.description}
          disabled={disabled}
          readOnly={readOnly}
          description={property.hint}
          className={className}
        >
          {property.displayName ?? ''}
        </Combobox>
      );
    }

    return (
      <Combobox
        required={required}
        name={property.id!}
        items={property.validValues!}
        keySelector={value => value}
        valueSelector={value => value}
        defaultValue={defaultValue}
        title={property.description}
        disabled={disabled}
        readOnly={readOnly}
        description={property.hint}
        className={className}
      >
        {property.displayName ?? ''}
      </Combobox>
    );
  }

  const passwordSaved = showRememberTip && ((isPassword && !!property.value) || saved);
  const passwordSavedMessage = passwordSaved ? translate('core_blocks_object_property_info_password_saved') : undefined;

  if (controlType === 'file' && state) {
    return (
      <InputFileTextContent
        required={required}
        tooltip={property.description}
        labelTooltip={property.displayName || property.description}
        name={property.id!}
        state={state}
        disabled={disabled}
        fileName={passwordSavedMessage}
        className={className}
        mapValue={removeMetadataFromDataURL}
      >
        {property.displayName}
      </InputFileTextContent>
    );
  }

  if (controlType === 'textarea') {
    if (state !== undefined) {
      return (
        <Textarea
          required={required}
          title={state[property.id!]}
          labelTooltip={property.description || property.displayName}
          placeholder={passwordSavedMessage}
          name={property.id!}
          state={state}
          disabled={disabled}
          readOnly={readOnly}
          className={className}
        >
          {property.displayName ?? ''}
        </Textarea>
      );
    }

    return (
      <Textarea
        required={required}
        title={value}
        labelTooltip={property.description || property.displayName}
        placeholder={passwordSavedMessage}
        name={property.id!}
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        className={className}
      >
        {property.displayName ?? ''}
      </Textarea>
    );
  }

  if (state !== undefined) {
    return (
      <InputField
        required={required}
        type={type}
        title={isPassword ? property.description || property.displayName : undefined}
        labelTooltip={property.description || property.displayName}
        name={property.id!}
        state={state}
        defaultState={defaultState || { [property.id!]: defaultValue }}
        autoHide={autoHide}
        description={property.hint}
        placeholder={passwordSavedMessage}
        disabled={disabled}
        readOnly={readOnly}
        autoComplete={RESERVED_KEYWORDS.includes(autofillToken) ? autofillToken : `${autofillToken} ${property.id}`}
        className={className}
        canShowPassword={canShowPassword}
        onFocus={onFocus}
      >
        {property.displayName}
      </InputField>
    );
  }

  return (
    <InputField
      required={required}
      type={type}
      title={isPassword ? property.description || property.displayName : undefined}
      labelTooltip={property.description || property.displayName}
      name={property.id!}
      value={value}
      defaultValue={defaultValue}
      description={property.hint}
      placeholder={passwordSavedMessage}
      disabled={disabled}
      readOnly={readOnly}
      autoComplete={RESERVED_KEYWORDS.includes(autofillToken) ? autofillToken : `${autofillToken} ${property.id}`}
      className={className}
      canShowPassword={canShowPassword}
      onFocus={onFocus}
    >
      {property.displayName}
    </InputField>
  );
});
