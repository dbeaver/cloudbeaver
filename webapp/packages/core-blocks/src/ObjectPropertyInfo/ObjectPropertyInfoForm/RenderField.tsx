/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  ConditionType,
  getObjectPropertyDefaultValue,
  getObjectPropertyType,
  getObjectPropertyValue,
  getObjectPropertyValueType,
  type ObjectPropertyInfo,
} from '@cloudbeaver/core-sdk';
import { EMPTY_ARRAY, removeMetadataFromDataURL } from '@cloudbeaver/core-utils';

import { FieldCheckbox } from '../../FormControls/Checkboxes/FieldCheckbox.js';
import { Combobox } from '../../FormControls/Combobox.js';
import { FormFieldDescription } from '../../FormControls/FormFieldDescription.js';
import { InputField } from '../../FormControls/InputField/InputField.js';
import { InputFileTextContent } from '../../FormControls/InputFileTextContent.js';
import { isControlPresented } from '../../FormControls/isControlPresented.js';
import { Textarea } from '../../FormControls/Textarea.js';
import { Link } from '../../Link.js';
import { useTranslate } from '../../localization/useTranslate.js';
import { evaluate } from '../evaluate.js';

const RESERVED_KEYWORDS = ['no', 'off', 'new-password'];

interface RenderFieldProps {
  property: ObjectPropertyInfo;
  state?: Record<string, any>;
  context?: Record<string, any>;
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

export const RenderField = observer<RenderFieldProps>(function RenderField({
  property,
  state,
  defaultState,
  context,
  editable = true,
  autofillToken = '',
  disabled,
  autoHide,
  showRememberTip,
  saved,
  className,
  canShowPassword,
  onFocus,
  readOnly,
}) {
  const translate = useTranslate();

  let readonly = readOnly;

  const controlType = getObjectPropertyType(property);
  const type = getObjectPropertyValueType(property);
  const isPassword = type === 'password';
  const evaluateContext = context ?? { ...defaultState, ...state };

  for (const condition of property.conditions ?? EMPTY_ARRAY) {
    const result = evaluate(condition.expression, evaluateContext);

    if (condition.conditionType === ConditionType.Hide && result === true) {
      return null;
    }

    if (condition.conditionType === ConditionType.ReadOnly && result === true) {
      readonly = true;
    }
  }

  const required = property.required && !readonly;
  const value = getObjectPropertyValue(property);
  const defaultValue = getObjectPropertyDefaultValue(property);

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
          disabled={disabled || readonly}
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
        disabled={disabled || readonly}
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
          readOnly={readonly}
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
        readOnly={readonly}
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
          readOnly={readonly}
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
        readOnly={readonly || disabled}
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
        readOnly={readonly || disabled}
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
      readOnly={readonly || disabled}
      autoComplete={RESERVED_KEYWORDS.includes(autofillToken) ? autofillToken : `${autofillToken} ${property.id}`}
      className={className}
      canShowPassword={canShowPassword}
      onFocus={onFocus}
    >
      {property.displayName}
    </InputField>
  );
});
