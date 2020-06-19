/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { TableColumnHeader } from '@cloudbeaver/core-blocks';
import { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

const styles = css`
  TableColumnHeader:nth-child(2) {
    width:16px;
    border-right: none;
  }
`;

type HeaderProps = {
  properties: Pick<
    ObjectPropertyInfo,
    | 'value'
    | 'id'
    | 'features'
    | 'category'
    | 'dataType'
    | 'description'
    | 'displayName'
    >[];
}

export function Header({ properties }: HeaderProps) {

  return styled(useStyles(styles))(
    <>
      <TableColumnHeader min></TableColumnHeader>
      <TableColumnHeader></TableColumnHeader>
      {properties.map(property => (
        <TableColumnHeader key={property.id} title={property.description}>
          {property.displayName}
        </TableColumnHeader>
      ))}
    </>
  );
}
