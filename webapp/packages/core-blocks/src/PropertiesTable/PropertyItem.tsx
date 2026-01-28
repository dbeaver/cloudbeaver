/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useLayoutEffect, useRef } from 'react';
import { Input } from '@dbeaver/ui-kit';
import { getObjectPropertyOptionName, getObjectPropertyOptionValue } from '@cloudbeaver/core-sdk';
import { isNotNullDefined } from '@dbeaver/js-helpers';

import { useTranslate } from '../localization/useTranslate.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import type { IProperty } from './IProperty.js';
import classes from './PropertyItem.module.css';
import { Combobox } from '../FormControls/Combobox.js';
import { ActionIconButton } from '../ActionIconButton.js';

interface Props {
  property: IProperty;
  value?: string;
  onNameChange: (staticId: string, newId: string) => void;
  onValueChange: (staticId: string, value: string | null) => void;
  onRemove: (staticId: string) => void;
  removable?: boolean;
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
  removable,
  readOnly,
}) {
  const styles = useS(classes);
  const translate = useTranslate();
  const isDeletable = !readOnly && !property.displayName && removable;
  const defaultValue = isNotNullDefined(property.defaultValue) ? String(getObjectPropertyOptionValue(property.defaultValue)) : undefined;
  const edited = value !== undefined && value !== defaultValue;
  const keyInputRef = useRef<HTMLInputElement>(null);

  const handleKeyChange = useCallback((key: string) => onNameChange(property.id, key), [property]);
  const handleValueChange = useCallback((value: string | null) => onValueChange(property.id, value), [property]);
  const handleRemove = useCallback(() => onRemove(property.id), [property]);
  function handleRevert() {
    onValueChange(property.id, defaultValue ?? null);
  }

  useLayoutEffect(() => {
    if (keyInputRef.current && isDeletable && property.new && !(document.activeElement instanceof HTMLInputElement)) {
      keyInputRef.current.focus();
    }
  }, [property]);

  return (
    <div className={s(styles, { container: true })}>
      <div className={s(styles, { name: true, error })}>
        <Input
          ref={keyInputRef}
          title={property.description}
          value={property.displayName}
          defaultValue={property.key}
          type="text"
          name={property.id}
          placeholder={property.keyPlaceholder}
          readOnly={!isDeletable}
          autoComplete="none"
          size="small"
          onChange={e => handleKeyChange(e.target.value)}
        />
      </div>
      <div className={s(styles, { value: true })}>
        <Combobox
          value={value}
          defaultValue={defaultValue}
          title={value}
          name={`${property.id}_value`}
          placeholder={property.valuePlaceholder}
          items={property.validValues || []}
          keySelector={getObjectPropertyOptionValue}
          valueSelector={getObjectPropertyOptionName}
          readOnly={readOnly}
          size="small"
          tiny
          fill
          allowCustomValue
          onChange={handleValueChange}
        />
        <div className={s(styles, { actions: true })}>
          {edited && !isDeletable && (
            <ActionIconButton
              title={translate('core_blocks_properties_table_item_reset')}
              name="/icons/data_revert_all_sm.svg"
              viewBox="0 0 16 16"
              type="button"
              onClick={handleRevert}
            />
          )}
          {isDeletable && (
            <ActionIconButton
              title={translate('core_blocks_properties_table_item_remove')}
              name="reject"
              viewBox="0 0 11 11"
              type="button"
              onClick={handleRemove}
            />
          )}
        </div>
      </div>
    </div>
  );
});
