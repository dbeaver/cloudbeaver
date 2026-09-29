/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Combobox } from '@cloudbeaver/core-blocks';
import { getObjectPropertyOptionName, getObjectPropertyOptionValue } from '@cloudbeaver/core-sdk';
import { isNotNullDefined } from '@dbeaver/js-helpers';

import type { IDriverProperty } from './IDriverProperty.js';

interface Props {
  property: IDriverProperty;
  value?: string | null;
  readOnly?: boolean;
  tabIndex: number;
  onChange: (id: string, value: string | null) => void;
}

export const DriverPropertyValueCell = observer<Props>(function DriverPropertyValueCell({ property, value, readOnly, tabIndex, onChange }) {
  const defaultValue = isNotNullDefined(property.defaultValue) ? String(getObjectPropertyOptionValue(property.defaultValue)) : undefined;

  return (
    <div className="tw:flex tw:w-full tw:min-w-0 tw:items-center tw:gap-1">
      <Combobox
        value={value ?? undefined}
        defaultValue={defaultValue}
        title={value ?? undefined}
        name={`${property.id}_value`}
        placeholder={property.valuePlaceholder}
        items={property.validValues || []}
        keySelector={getObjectPropertyOptionValue}
        valueSelector={getObjectPropertyOptionName}
        className="tw:min-w-0 tw:flex-1 tw:[--dbv-kit-combobox-background:transparent] tw:[--dbv-kit-combobox-border-color:transparent] tw:focus-within:[--dbv-kit-combobox-background:var(--theme-input-background)] tw:focus-within:[--dbv-kit-combobox-border-color:var(--theme-primary)]"
        readOnly={readOnly}
        size="small"
        tabIndex={tabIndex}
        tiny
        fill
        allowCustomValue
        onChange={value => onChange(property.id, value)}
      />
    </div>
  );
});
