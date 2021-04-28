/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { useService } from '@cloudbeaver/core-di';

import type { IDatabaseDataModel } from '../../../DatabaseDataModel/IDatabaseDataModel';
import { TableFooterMenuItem } from './TableFooterMenuItem';
import { TableFooterMenuService } from './TableFooterMenuService';

const styles = css`
  menu-wrapper {
    display: flex;
    height: 100%;
  }
`;

interface TableFooterMenuProps {
  resultIndex: number;
  model: IDatabaseDataModel<any, any>;
  className?: string;
}

export const TableFooterMenu = observer(function TableFooterMenu({
  resultIndex,
  model,
  className,
}: TableFooterMenuProps) {
  const mainMenuService = useService(TableFooterMenuService);

  return styled(styles)(
    <menu-wrapper className={className}>
      {mainMenuService.constructMenuWithContext(model, resultIndex).map((topItem, i) => (
        <TableFooterMenuItem key={i} menuItem={topItem} />
      ))}
    </menu-wrapper>
  );
});
