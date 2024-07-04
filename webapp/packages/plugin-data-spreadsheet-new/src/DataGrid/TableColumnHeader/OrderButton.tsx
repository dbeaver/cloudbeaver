/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { IconOrImage, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { DatabaseDataConstraintAction, EOrder, getNextOrder, IDatabaseDataModel } from '@cloudbeaver/plugin-data-viewer';

import style from './OrderButton.module.css';

interface Props {
  model: IDatabaseDataModel;
  resultIndex: number;
  attributePosition: number;
  className?: string;
}

export const OrderButton = observer<Props>(function OrderButton({ model, resultIndex, attributePosition, className }) {
  const translate = useTranslate();
  const constraints = model.source.getAction(resultIndex, DatabaseDataConstraintAction);
  const currentOrder = constraints.getOrder(attributePosition);
  const disabled = model.isDisabled(resultIndex) || model.isLoading();
  const styles = useS(style);

  let icon = 'order-arrow-unknown';
  if (currentOrder === EOrder.asc) {
    icon = 'order-arrow-asc';
  } else if (currentOrder === EOrder.desc) {
    icon = 'order-arrow-desc';
  }

  const handleSort = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const nextOrder = getNextOrder(currentOrder);
    await model.request(() => {
      constraints.setOrder(attributePosition, nextOrder, e.ctrlKey || e.metaKey);
    });
  };

  function preventFocus(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
  }

  return (
    <button
      title={translate('data_grid_table_tooltip_column_header_order')}
      className={s(styles, { orderButton: true }, className)}
      disabled={disabled}
      onMouseDown={preventFocus}
      onClick={handleSort}
    >
      <IconOrImage icon={icon} viewBox="0 0 16 16" className={s(styles, {}, currentOrder === null && 'rdg-table-header__order-button_unordered')} />
    </button>
  );
});
