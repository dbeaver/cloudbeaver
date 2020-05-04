/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import styled, { css, use } from 'reshadow';

import { composes, useStyles } from '@dbeaver/core/theming';

import { Icon } from '../Icons';
import { ShadowInput } from '../ShadowInput';
import { DriverPropertyValueSelector } from './DriverPropertyValueSelector';
import { IProperty } from './IProperty';

const styles = composes(
  css`
    property-item, button {
      composes: theme-ripple from global;
    }
    ShadowInput {
      composes: theme-background-surface from global;
    }
    [|error] {
      composes: theme-text-error from global;
    }
  `,
  css`
    property-item {
      box-sizing: border-box;
      display: inline-flex;
      padding: 0px 1px;
    }
    property-name, property-value {
      composes: theme-typography--caption from global;
      position: relative;
      box-sizing: border-box;
      flex: 1;
      margin: 0px 1px;
      padding: 4px 0;

      & ShadowInput {
        padding: 0 36px;
      }
    }
    property-name {
      flex: 0 0 auto;
      width: 300px;
    }
    property-remove {
      position: relative;
      flex: 0 0 auto;
      align-items: center;
      display: flex;
      opacity: 0;
    }
    property-select {
      position: relative;
      flex: 0 0 auto;
      align-items: center;
      display: flex;
    }
    property-item:hover property-remove {
      opacity: 1;
    }
    ShadowInput {
      box-sizing: border-box;
      font: inherit;
      color: inherit;
      width: 100%;
      outline: none;
      border: solid 1px #01cca3;

      &[|edited] {
        font-weight: 600;
      }
      &:not(:focus):not([|focus]) {
        background: transparent;
        border: solid 1px transparent;
      }
    }
    Icon {
      height: 16px;
      display: block;
    }
    property-select Icon {
      transform: rotate(90deg);

      &[|focus] {
        transform: rotate(-90deg);
      }
    }
    button {
      background: transparent;
      outline: none;
      padding: 4px;
      cursor: pointer;
    }
  `
);

type PropertyItemProps = {
  property: IProperty;
  value?: string;
  onNameChange(staticId: string, newId: string): void;
  onValueChange(staticId: string, value: string): void;
  onRemove(staticId: string): void;
  error?: boolean;
}

export const PropertyItem = observer(function PropertyItem({
  property,
  value,
  onNameChange,
  onValueChange,
  onRemove,
  error,
}: PropertyItemProps) {
  const isEditable = property.name !== property.id;
  const edited = value !== undefined && value !== property.defaultValue;
  const [focus, setFocus] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const handleNameChange = useCallback((value: string) => onNameChange(property.id, value), [property]);
  const handleValueChange = useCallback(
    (value: string) => onValueChange(property.id, value),
    [property]
  );
  const handleRemove = useCallback(() => onRemove(property.id), [property]);

  useEffect(() => {
    if (nameInputRef.current && isEditable) {
      nameInputRef.current.focus();
    }
  }, []);

  return styled(useStyles(styles))(
    <property-item as="div">
      <property-name as='div' title={property.description} {...use({ error })}>
        <ShadowInput
          type='text'
          name={property.id}
          onChange={handleNameChange}
          ref={nameInputRef}
          readOnly={!isEditable}
          autoComplete='none'
        >
          {property.name || property.id}
        </ShadowInput>
      </property-name>
      <property-value as='div'>
        <ShadowInput
          type='text'
          name={`${property.id}_value`}
          onChange={handleValueChange}
          autoComplete='none'
          {...use({ focus, edited })}
        >
          {value !== undefined ? value : property.defaultValue}
        </ShadowInput>
      </property-value>
      {(property.validValues && property.validValues.length > 0) && (
        <property-select as="div">
          <DriverPropertyValueSelector
            propertyName={property.id}
            values={property.validValues}
            onSelect={handleValueChange}
            onSwitch={setFocus}
          >
            <Icon name="arrow" viewBox="0 0 16 16" {...use({ focus })} />
          </DriverPropertyValueSelector>
        </property-select>
      )}
      {isEditable && (
        <property-remove as="div">
          <button type="button" onClick={handleRemove}><Icon name="reject" viewBox="0 0 11 11" /></button>
        </property-remove>
      )}
    </property-item>
  );
});
