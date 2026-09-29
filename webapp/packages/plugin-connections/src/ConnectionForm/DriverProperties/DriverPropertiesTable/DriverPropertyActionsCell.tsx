/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ActionIconButton, useTranslate } from '@cloudbeaver/core-blocks';

import type { IDriverProperty } from './IDriverProperty.js';

interface Props {
  property: IDriverProperty;
  edited: boolean;
  readOnly?: boolean;
  tabIndex: number;
  onReset: (id: string) => void;
  onRemove: (property: IDriverProperty) => void;
}

export const DriverPropertyActionsCell = observer<Props>(function DriverPropertyActionsCell({
  property,
  edited,
  readOnly,
  tabIndex,
  onReset,
  onRemove,
}) {
  const translate = useTranslate();

  if (readOnly) {
    return null;
  }

  if (property.custom) {
    return (
      <ActionIconButton
        className="tw:transition-opacity tw:duration-100 tw:ease-[ease] tw:[@media(hover:hover)]:[.rdg-row:not(:hover):not(:focus-within)_&]:pointer-events-none tw:[@media(hover:hover)]:[.rdg-row:not(:hover):not(:focus-within)_&]:opacity-0"
        title={translate('core_blocks_properties_table_item_remove')}
        name="reject"
        type="button"
        tabIndex={tabIndex}
        onClick={() => onRemove(property)}
      />
    );
  }

  if (edited) {
    return (
      <ActionIconButton
        title={translate('core_blocks_properties_table_item_reset')}
        name="/icons/data_revert_all_sm.svg"
        type="button"
        img
        tabIndex={tabIndex}
        onClick={() => onReset(property.id)}
      />
    );
  }

  return null;
});
