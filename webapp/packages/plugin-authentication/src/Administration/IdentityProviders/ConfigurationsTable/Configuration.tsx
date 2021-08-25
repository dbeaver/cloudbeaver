/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { AuthProvidersResource } from '@cloudbeaver/core-authentication';
import {
  TableItem, TableColumnValue, TableItemSelect, TableItemExpand,
  Placeholder, StaticImage, useMapResource
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { AdminAuthProviderConfiguration } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { ConfigurationsAdministrationService } from '../ConfigurationsAdministrationService';
import { ConfigurationEdit } from './ConfigurationEdit';

const styles = css`
  StaticImage {
    display: flex;
    width: 24px;

    &:not(:last-child) {
      margin-right: 16px;
    }
  }
  TableColumnValue[expand] {
    cursor: pointer;
  }
  TableColumnValue[|gap] {
    gap: 16px;
  }
`;

interface Props {
  configuration: AdminAuthProviderConfiguration;
}

export const Configuration: React.FC<Props> = observer(function Configuration({ configuration }) {
  const service = useService(ConfigurationsAdministrationService);
  const resource = useMapResource(AuthProvidersResource, configuration.providerId);

  const icon = configuration.iconURL || resource.data?.icon;

  return styled(useStyles(styles))(
    <TableItem item={configuration.id} expandElement={ConfigurationEdit}>
      <TableColumnValue centerContent flex>
        <TableItemSelect />
      </TableColumnValue>
      <TableColumnValue centerContent flex expand>
        <TableItemExpand />
      </TableColumnValue>
      <TableColumnValue centerContent flex expand>
        <StaticImage icon={icon} />
      </TableColumnValue>
      <TableColumnValue expand>{configuration.displayName}</TableColumnValue>
      <TableColumnValue>{configuration.providerId}</TableColumnValue>
      <TableColumnValue>{configuration.description || ''}</TableColumnValue>
      <TableColumnValue flex {...use({ gap: true })}>
        <Placeholder container={service.configurationDetailsPlaceholder} configuration={configuration} />
      </TableColumnValue>
    </TableItem>
  );
});
