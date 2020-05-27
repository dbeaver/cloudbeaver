/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { AdministrationTools } from '@dbeaver/administration';
import {
  Table, TableHeader, TableColumnHeader, TableBody, TableItem, TableColumnValue
} from '@dbeaver/core/blocks';
import { useStyles, composes } from '@dbeaver/core/theming';

const styles = composes(
  css`
    AdministrationTools {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
  `,
  css`
    content {
      padding-top: 16px;
    }
    TableColumnHeader {
      border-top: solid 1px;
    }
  `
);

export const UsersAdministration = observer(function UsersAdministration() {
  return styled(useStyles(styles))(
    <>
      <AdministrationTools></AdministrationTools>
      <content as='div'>
        <Table>
          <TableHeader>
            <TableColumnHeader>User login</TableColumnHeader>
            <TableColumnHeader>User first name</TableColumnHeader>
            <TableColumnHeader>User last name</TableColumnHeader>
            <TableColumnHeader>User last name</TableColumnHeader>
            <TableColumnHeader></TableColumnHeader>
          </TableHeader>
          <TableBody>
            <TableItem item={0}>
              <TableColumnValue>a</TableColumnValue>
              <TableColumnValue>b</TableColumnValue>
              <TableColumnValue>c</TableColumnValue>
              <TableColumnValue>d</TableColumnValue>
              <TableColumnValue></TableColumnValue>
            </TableItem>
            <TableItem item={1}>
              <TableColumnValue>a</TableColumnValue>
              <TableColumnValue>b</TableColumnValue>
              <TableColumnValue>c</TableColumnValue>
              <TableColumnValue>d</TableColumnValue>
              <TableColumnValue></TableColumnValue>
            </TableItem>
            <TableItem item={2}>
              <TableColumnValue>a</TableColumnValue>
              <TableColumnValue>b</TableColumnValue>
              <TableColumnValue>c</TableColumnValue>
              <TableColumnValue>d</TableColumnValue>
              <TableColumnValue></TableColumnValue>
            </TableItem>
            <TableItem item={3}>
              <TableColumnValue>a</TableColumnValue>
              <TableColumnValue>b</TableColumnValue>
              <TableColumnValue>c</TableColumnValue>
              <TableColumnValue>d</TableColumnValue>
              <TableColumnValue></TableColumnValue>
            </TableItem>
          </TableBody>
        </Table>
      </content>
    </>
  );
});
