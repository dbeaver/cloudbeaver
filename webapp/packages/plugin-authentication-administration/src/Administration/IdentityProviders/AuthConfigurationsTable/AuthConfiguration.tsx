/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { AuthProvidersResource } from '@cloudbeaver/core-authentication';
import {
  TableItem, TableColumnValue, TableItemSelect, TableItemExpand,
  Placeholder, StaticImage, useMapResource, FieldCheckbox
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { AdminAuthProviderConfiguration } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { AuthConfigurationsAdministrationService } from '../AuthConfigurationsAdministrationService';
import { AuthConfigurationEdit } from './AuthConfigurationEdit';

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

export const AuthConfiguration = observer<Props>(function AuthConfiguration({ configuration }) {
  const service = useService(AuthConfigurationsAdministrationService);
  const resource = useMapResource(AuthConfiguration, AuthProvidersResource, configuration.providerId);

  const icon = configuration.iconURL || resource.data?.icon;

  return styled(useStyles(styles))(
    <TableItem item={configuration.id} expandElement={AuthConfigurationEdit}>
      <TableColumnValue centerContent flex>
        <TableItemSelect />
      </TableColumnValue>
      <TableColumnValue centerContent flex expand>
        <TableItemExpand />
      </TableColumnValue>
      <TableColumnValue centerContent flex expand>
        <StaticImage icon={icon} title={`${configuration.displayName} icon`} />
      </TableColumnValue>
      <TableColumnValue title={configuration.displayName} expand ellipsis>{configuration.displayName}</TableColumnValue>
      <TableColumnValue>{configuration.providerId}</TableColumnValue>
      <TableColumnValue title={configuration.description} ellipsis>{configuration.description || ''}</TableColumnValue>
      <TableColumnValue>
        <FieldCheckbox checked={configuration.disabled} disabled />
      </TableColumnValue>
      <TableColumnValue flex {...use({ gap: true })}>
        <Placeholder container={service.configurationDetailsPlaceholder} configuration={configuration} />
      </TableColumnValue>
    </TableItem>
  );
});
