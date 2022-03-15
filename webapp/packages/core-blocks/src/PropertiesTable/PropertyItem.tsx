/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useRef, useState, useLayoutEffect } from 'react';
import styled, { css, use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { ShadowInput } from '../FormControls/ShadowInput';
import { Icon } from '../Icon';
import type { IProperty } from './IProperty';
import { PropertyValueSelector } from './PropertyValueSelector';

const styles = css`
    [|error] {
      composes: theme-text-error from global;
    }
    property-item, button {
      composes: theme-ripple from global;
    }
    property-item {
      box-sizing: border-box;
      display: inline-flex;
      padding: 0px 1px;
    }
    property-name, property-value {
      composes: theme-typography--caption from global;
      position: relative;
      display: flex;
      align-items: center;
      box-sizing: border-box;
      flex: 1;
      padding: 4px 0;

      & ShadowInput {
        height: 24px;
        padding: 0 36px 0 12px;
      }
    }
    property-value, property-name {
      margin-left: 24px;
    }
    property-name {
      flex: 0 0 auto;
      width: 276px;
    }
    property-remove {
      position: relative;
      flex: 0 0 auto;
      align-items: center;
      display: flex;
      opacity: 0;
    }
    property-select {
      flex: 0 0 auto;
      align-items: center;
      display: flex;
    }
    property-item:hover property-remove {
      opacity: 1;
    }
    ShadowInput {
      composes: theme-background-surface from global;
    }
    property-name ShadowInput, property-value ShadowInput {
      box-sizing: border-box;
      font: inherit;
      color: inherit;
      width: 100%;
      outline: none;

      &[|edited] {
        font-weight: 600;
      }
      &:global([readonly]), &:not(:focus):not([|focus]) {
        background: transparent !important;
        border: solid 2px transparent !important;
      }
    }
    Icon {
      height: 16px;
      display: block;
    }
    property-select Icon {
      &[|focus] {
        transform: rotate(180deg);
      }
    }
    button {
      background: transparent;
      outline: none;
      padding: 4px;
      cursor: pointer;
    }
    button, PropertyValueSelector {
      composes: theme-form-element-radius from global;
      margin: 2px;
      overflow: hidden;
    }
  `;

interface Props {
  property: IProperty;
  value?: string;
  onNameChange: (staticId: string, newId: string) => void;
  onValueChange: (staticId: string, value: string) => void;
  onRemove: (staticId: string) => void;
  error?: boolean;
  readOnly?: boolean;
}

export const PropertyItem = observer<Props>(function PropertyItem({
  property,
  value,
  onNameChange,
  onValueChange,
  onRemove,
  error,
  readOnly,
}) {
  const isDeletable = !readOnly && !property.displayName;
  const edited = value !== undefined && value !== property.defaultValue;
  const propertyValue = value !== undefined ? value : property.defaultValue;
  const [menuOpen, setMenuOpen] = useState(false);
  const keyInputRef = useRef<HTMLInputElement>(null);
  const [valueRef, setValueRef] = useState<HTMLDivElement | null>(null);

  const handleKeyChange = useCallback((key: string) => onNameChange(property.id, key), [property]);
  const handleValueChange = useCallback(
    (value: string) => onValueChange(property.id, value),
    [property]
  );
  const handleRemove = useCallback(() => onRemove(property.id), [property]);

  useLayoutEffect(() => {
    if (keyInputRef.current && isDeletable && property.new) {
      keyInputRef.current.focus();
    }
  }, [property]);

  const focus = menuOpen;

  return styled(useStyles(styles))(
    <property-item>
      <property-name title={property.description} {...use({ error })}>
        <ShadowInput
          ref={keyInputRef}
          type='text'
          name={property.id}
          placeholder={property.keyPlaceholder}
          readOnly={!isDeletable}
          autoComplete='none'
          onChange={handleKeyChange}
        >
          {property.displayName || property.key}
        </ShadowInput>
      </property-name>
      <property-value ref={setValueRef} title={propertyValue}>
        <ShadowInput
          type='text'
          name={`${property.id}_value`}
          placeholder={property.valuePlaceholder}
          autoComplete='none'
          readOnly={readOnly}
          data-focus={focus}
          onChange={handleValueChange}
          {...use({ focus, edited })}
        >
          {propertyValue}
        </ShadowInput>
        {(!readOnly && property.validValues && property.validValues.length > 0) && (
          <property-select>
            <PropertyValueSelector
              propertyName={property.id}
              values={property.validValues}
              container={valueRef}
              onSelect={handleValueChange}
              onSwitch={setMenuOpen}
            >
              <Icon name="arrow" viewBox="0 0 16 16" {...use({ focus })} />
            </PropertyValueSelector>
          </property-select>
        )}
      </property-value>
      {isDeletable && (
        <property-remove>
          <button type="button" onClick={handleRemove}><Icon name="reject" viewBox="0 0 11 11" /></button>
        </property-remove>
      )}
    </property-item>
  );
});
