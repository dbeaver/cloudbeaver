/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { useService } from '@cloudbeaver/core-di';

import { DataModelWrapper } from '../../DataModelWrapper';
import { TableFooterMenuItem } from './TableFooterMenuItem';
import { TableFooterMenuService } from './TableFooterMenuService';

const styles = css`
  menu-wrapper {
    display: flex;
    height: 100%;
  }
  TableFooterMenuItem {
    text-transform: uppercase;
    font-weight: 700;
  }
`;

type TableFooterMenuProps = {
  model: DataModelWrapper;
  className?: string;
}

export const TableFooterMenu = observer(function TableFooterMenu({ model, className }: TableFooterMenuProps) {
  const mainMenuService = useService(TableFooterMenuService);

  return styled(styles)(
    <menu-wrapper as="div" className={className}>
      {mainMenuService.constructMenuWithContext(model).map((topItem, i) => (
        <TableFooterMenuItem key={i} menuItem={topItem}/>
      ))}
    </menu-wrapper>
  );
});
