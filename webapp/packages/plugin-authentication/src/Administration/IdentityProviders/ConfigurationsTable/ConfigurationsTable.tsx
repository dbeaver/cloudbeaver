/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { Table, TableHeader, TableColumnHeader, TableBody } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { AdminAuthProviderConfiguration } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { Configuration } from './Configuration';

const styles = css`
  Table {
    width: 100%;
  }
`;

interface Props {
  configurations: AdminAuthProviderConfiguration[];
  selectedItems: Map<string, boolean>;
  expandedItems: Map<string, boolean>;
}

export const ConfigurationsTable: React.FC<Props> = observer(function ConfigurationsTable({ configurations, selectedItems, expandedItems }) {
  const translate = useTranslate();
  return styled(useStyles(styles))(
    <Table selectedItems={selectedItems} expandedItems={expandedItems} {...use({ size: 'big' })}>
      <TableHeader>
        <TableColumnHeader min />
        <TableColumnHeader min />
        <TableColumnHeader min />
        <TableColumnHeader>{translate('administration_identity_providers_provider_configuration_name')}</TableColumnHeader>
        <TableColumnHeader>{translate('administration_identity_providers_provider')}</TableColumnHeader>
        <TableColumnHeader>{translate('administration_identity_providers_provider_configuration_description')}</TableColumnHeader>
        <TableColumnHeader />
      </TableHeader>
      <TableBody>
        {configurations.map(configuration => (
          <Configuration key={configuration.id} configuration={configuration} />
        ))}
      </TableBody>
    </Table>
  );
});
