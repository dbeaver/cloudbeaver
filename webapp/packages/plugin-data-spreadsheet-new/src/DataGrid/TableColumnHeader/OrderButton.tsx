/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { IconOrImage } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { EOrder, getNextOrder, IDatabaseDataModel, ResultSetConstraintAction } from '@cloudbeaver/plugin-data-viewer';

const styles = css`
  order-button {
    display: flex;
    flex-direction: column;
    align-content: center;
    align-items: center;
    justify-content: center;
    height: 20px;
    width: 20px;
    box-sizing: border-box;
    cursor: pointer;
    background: transparent;
    outline: none;
    color: inherit;
  }
  order-button > IconOrImage {
    width: 12px;
  }
  order-button:hover > IconOrImage {
    width: 13px;
  }
`;

interface Props {
  model: IDatabaseDataModel;
  resultIndex: number;
  attributePosition: number;
  className?: string;
}

export const OrderButton = observer<Props>(function OrderButton({
  model,
  resultIndex,
  attributePosition,
  className,
}) {
  const translate = useTranslate();
  const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);
  const currentOrder = constraints.getOrder(attributePosition);
  const disabled = model.isDisabled(resultIndex) || model.isLoading();

  let icon = 'order-arrow-unknown';
  if (currentOrder === EOrder.asc) {
    icon = 'order-arrow-asc';
  } else if (currentOrder === EOrder.desc) {
    icon = 'order-arrow-desc';
  }

  const handleSort = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const nextOrder = getNextOrder(currentOrder);
    await model.requestDataAction(async () => {
      constraints.setOrder(attributePosition, nextOrder, e.ctrlKey || e.metaKey);
      await model.request(true);
    });
  };

  function preventFocus(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
  }

  return styled(styles)(
    <order-button
      as='button'
      title={translate('data_grid_table_tooltip_column_header_order')}
      className={className}
      disabled={disabled}
      onMouseDown={preventFocus}
      onClick={handleSort}
    >
      <IconOrImage
        icon={icon}
        viewBox='0 0 16 16'
        className={currentOrder === null ? 'rdg-table-header__order-button_unordered' : undefined}
      />
    </order-button>
  );
});
