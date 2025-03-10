/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ActionIconButton, useTranslate } from '@cloudbeaver/core-blocks';
import { DatabaseDataConstraintAction, EOrder, getNextOrder, type IDatabaseDataModel, ResultSetDataSource } from '@cloudbeaver/plugin-data-viewer';
import { clsx } from '@cloudbeaver/core-utils';

interface Props {
  model: IDatabaseDataModel<ResultSetDataSource>;
  resultIndex: number;
  attributePosition: number;
  className?: string;
}

export const OrderButton = observer<Props>(function OrderButton({ model, resultIndex, attributePosition, className }) {
  const translate = useTranslate();
  const constraints = model.source.getAction(resultIndex, DatabaseDataConstraintAction);
  const currentOrder = constraints.getOrder(attributePosition);
  const disabled = model.isDisabled(resultIndex) || model.isLoading();

  let icon = 'order-arrow-unknown';
  if (currentOrder === EOrder.asc) {
    icon = 'order-arrow-asc';
  } else if (currentOrder === EOrder.desc) {
    icon = 'order-arrow-desc';
  }

  const handleSort = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const nextOrder = getNextOrder(currentOrder);
    await model.request(() => {
      constraints.setOrder(attributePosition, nextOrder, e.ctrlKey || e.metaKey);
    });
  };

  function preventFocus(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
  }

  return (
    <ActionIconButton
      title={translate('data_grid_table_tooltip_column_header_order')}
      name={icon}
      tabIndex={-1}
      viewBox="0 0 16 16"
      className={clsx(currentOrder === null && 'rdg-table-header__order-button_unordered', className)}
      disabled={disabled}
      onMouseDown={preventFocus}
      onClick={handleSort}
    />
  );
});
