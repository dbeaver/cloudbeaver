/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Table, TableHeader, TableColumnHeader, TableBody, TableSelect, useTranslate } from '@cloudbeaver/core-blocks';
import type { AdminAuthProviderConfiguration } from '@cloudbeaver/core-sdk';

import { AuthConfiguration } from './AuthConfiguration';

interface Props {
  configurations: AdminAuthProviderConfiguration[];
  selectedItems: Map<string, boolean>;
  expandedItems: Map<string, boolean>;
}

export const AuthConfigurationsTable = observer<Props>(function AuthConfigurationsTable({ configurations, selectedItems, expandedItems }) {
  const translate = useTranslate();
  const keys = configurations.map(configuration => configuration.id);

  return (
    <Table keys={keys} selectedItems={selectedItems} expandedItems={expandedItems} size='big'>
      <TableHeader fixed>
        <TableColumnHeader min flex centerContent>
          <TableSelect />
        </TableColumnHeader>
        <TableColumnHeader min />
        <TableColumnHeader min />
        <TableColumnHeader>{translate('administration_identity_providers_provider_configuration_name')}</TableColumnHeader>
        <TableColumnHeader>{translate('administration_identity_providers_provider')}</TableColumnHeader>
        <TableColumnHeader>{translate('administration_identity_providers_provider_configuration_description')}</TableColumnHeader>
        <TableColumnHeader>{translate('administration_identity_providers_provider_configuration_disabled')}</TableColumnHeader>
        <TableColumnHeader />
      </TableHeader>
      <TableBody>
        {configurations.map(configuration => (
          <AuthConfiguration key={configuration.id} configuration={configuration} />
        ))}
      </TableBody>
    </Table>
  );
});
