/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import styled, { css, use } from 'reshadow';

import { ShadowInput } from '../FormControls/ShadowInput';
import { Icon } from '../Icon';
import { IconOrImage } from '../IconOrImage';
import { useTranslate } from '../localization/useTranslate';
import type { IProperty } from './IProperty';
import { PropertyValueSelector } from './PropertyValueSelector';

const styles = css`
  [|error] {
    composes: theme-text-error from global;
  }
  property-item,
  button {
    composes: theme-ripple from global;
  }
  property-item {
    box-sizing: border-box;
    display: inline-flex;
    padding: 0px 1px;
  }
  property-name,
  property-value {
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
  property-value,
  property-name {
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
  property-name ShadowInput,
  property-value ShadowInput {
    box-sizing: border-box;
    font: inherit;
    color: inherit;
    width: 100%;
    outline: none;

    &[|edited] {
      font-weight: 600;
    }
    &:global([readonly]),
    &:not(:focus):not([|focus]) {
      background: transparent !important;
      border: solid 2px transparent !important;
    }
  }
  Icon,
  IconOrImage {
    height: 16px;
    display: block;
  }
  property-select Icon,
  property-select IconOrImage {
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
  button,
  PropertyValueSelector {
    composes: theme-form-element-radius from global;
    margin: 2px;
    overflow: hidden;
  }
`;

interface Props {
  property: IProperty;
  value?: string;
  onNameChange: (staticId: string, newId: string) => void;
  onValueChange: (staticId: string, value: string | null) => void;
  onRemove: (staticId: string) => void;
  error?: boolean;
  readOnly?: boolean;
}

export const PropertyItem = observer<Props>(function PropertyItem({ property, value, onNameChange, onValueChange, onRemove, error, readOnly }) {
  const translate = useTranslate();
  const isDeletable = !readOnly && !property.displayName;
  const edited = value !== undefined && value !== property.defaultValue;
  const propertyValue = value !== undefined ? value : property.defaultValue;
  const [menuOpen, setMenuOpen] = useState(false);
  const keyInputRef = useRef<HTMLInputElement>(null);
  const [valueRef, setValueRef] = useState<HTMLDivElement | null>(null);

  const handleKeyChange = useCallback((key: string) => onNameChange(property.id, key), [property]);
  const handleValueChange = useCallback((value: string) => onValueChange(property.id, value), [property]);
  const handleRemove = useCallback(() => onRemove(property.id), [property]);
  function handleRevert() {
    onValueChange(property.id, property.defaultValue ?? null);
  }

  useLayoutEffect(() => {
    if (keyInputRef.current && isDeletable && property.new && !(document.activeElement instanceof HTMLInputElement)) {
      keyInputRef.current.focus();
    }
  }, [property]);

  const focus = menuOpen;
  const keyPlaceholder = String(property.keyPlaceholder);
  const valuePlaceholder = String(property.valuePlaceholder);

  return styled(styles)(
    <property-item>
      <property-name title={property.description} {...use({ error })}>
        <ShadowInput
          ref={keyInputRef}
          type="text"
          name={property.id}
          placeholder={keyPlaceholder}
          readOnly={!isDeletable}
          autoComplete="none"
          onChange={handleKeyChange}
        >
          {property.displayName || property.key}
        </ShadowInput>
      </property-name>
      <property-value ref={setValueRef} title={String(propertyValue)}>
        <ShadowInput
          type="text"
          name={`${property.id}_value`}
          placeholder={valuePlaceholder}
          autoComplete="none"
          readOnly={readOnly}
          data-focus={focus}
          onChange={handleValueChange}
          {...use({ focus, edited })}
        >
          {propertyValue}
        </ShadowInput>
        {edited && !isDeletable && (
          <property-remove title={translate('core_blocks_properties_table_item_reset')}>
            <button type="button" onClick={handleRevert}>
              <IconOrImage icon="/icons/data_revert_all_sm.svg" viewBox="0 0 16 16" />
            </button>
          </property-remove>
        )}
        {isDeletable && (
          <property-remove title={translate('core_blocks_properties_table_item_remove')}>
            <button type="button" onClick={handleRemove}>
              <Icon name="reject" viewBox="0 0 11 11" />
            </button>
          </property-remove>
        )}
        {!readOnly && property.validValues && property.validValues.length > 0 && (
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
    </property-item>,
  );
});
