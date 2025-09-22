/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useLayoutEffect, useRef } from 'react';

import { ShadowInput } from '../FormControls/ShadowInput.js';
import { Icon } from '../Icon.js';
import { IconOrImage } from '../IconOrImage.js';
import { useTranslate } from '../localization/useTranslate.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import type { IProperty } from './IProperty.js';
import classes from './PropertyItem.module.css';
import { Combobox } from '../FormControls/Combobox.js';
import { isNotNullDefined } from '@dbeaver/js-helpers';

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
  const styles = useS(classes);
  const translate = useTranslate();
  const isDeletable = !readOnly && !property.displayName;
  const edited = value !== undefined && value !== property.defaultValue;
  const propertyValue = value !== undefined ? value : property.defaultValue;
  const keyInputRef = useRef<HTMLInputElement>(null);

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

  const keyPlaceholder = String(property.keyPlaceholder);
  const valuePlaceholder = isNotNullDefined(property.valuePlaceholder) ? String(property.valuePlaceholder) : '';

  return (
    <div className={s(styles, { container: true })}>
      <div className={s(styles, { name: true, error })} title={property.description}>
        <ShadowInput
          ref={keyInputRef}
          className={s(styles, { shadowInput: true })}
          type="text"
          name={property.id}
          placeholder={keyPlaceholder}
          readOnly={!isDeletable}
          autoComplete="none"
          onChange={handleKeyChange}
        >
          {property.displayName || property.key}
        </ShadowInput>
      </div>
      <div className={s(styles, { value: true })} title={String(propertyValue)}>
        {!readOnly && property.validValues && property.validValues.length > 0 && (
          <Combobox value={value || valuePlaceholder} items={property.validValues} tiny fill onSelect={handleValueChange} />
        )}
        <div className={s(styles, { remove: true })} title={translate('core_blocks_properties_table_item_reset')}>
          <button hidden={!edited || isDeletable} className={s(styles, { button: true })} type="button" onClick={handleRevert}>
            <IconOrImage className={s(styles, { iconOrImage: true })} icon="/icons/data_revert_all_sm.svg" viewBox="0 0 16 16" />
          </button>
        </div>
        {isDeletable && (
          <div className={s(styles, { remove: true })} title={translate('core_blocks_properties_table_item_remove')}>
            <button className={s(styles, { button: true })} type="button" onClick={handleRemove}>
              <Icon className={s(styles, { icon: true })} name="reject" viewBox="0 0 11 11" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
