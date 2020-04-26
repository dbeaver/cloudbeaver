/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { ObjectPropertyInfo } from '@dbeaver/core/sdk';
import { useStyles } from '@dbeaver/core/theming';

const styles = css`
  th:first-child {
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
    <tr>
      <th></th>
      {properties.map(property => (
        <th key={property.id} title={property.description}>
          {property.displayName}
        </th>
      ))}
    </tr>
  );
}
