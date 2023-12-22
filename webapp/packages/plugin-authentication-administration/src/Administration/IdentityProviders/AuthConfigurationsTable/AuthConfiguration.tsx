/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { AuthProvidersResource } from '@cloudbeaver/core-authentication';
import {
  FieldCheckbox,
  Loader,
  Placeholder,
  s,
  StaticImage,
  TableColumnValue,
  TableItem,
  TableItemExpand,
  TableItemSelect,
  useResource,
  useS,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { AdminAuthProviderConfiguration } from '@cloudbeaver/core-sdk';

import { AuthConfigurationsAdministrationService } from '../AuthConfigurationsAdministrationService';
import style from './AuthConfiguration.m.css';
import { AuthConfigurationEdit } from './AuthConfigurationEdit';

interface Props {
  configuration: AdminAuthProviderConfiguration;
}

export const AuthConfiguration = observer<Props>(function AuthConfiguration({ configuration }) {
  const styles = useS(style);
  const service = useService(AuthConfigurationsAdministrationService);
  const resource = useResource(AuthConfiguration, AuthProvidersResource, configuration.providerId);

  const icon = configuration.iconURL || resource.data?.icon;

  return (
    <TableItem item={configuration.id} expandElement={AuthConfigurationEdit}>
      <TableColumnValue centerContent flex>
        <TableItemSelect />
      </TableColumnValue>
      <TableColumnValue className={s(styles, { expand: true })} centerContent flex expand>
        <TableItemExpand />
      </TableColumnValue>
      <TableColumnValue className={s(styles, { expand: true })} centerContent flex expand>
        <StaticImage className={s(styles, { staticImage: true })} icon={icon} title={`${configuration.displayName} icon`} />
      </TableColumnValue>
      <TableColumnValue className={s(styles, { expand: true })} title={configuration.displayName} expand ellipsis>
        {configuration.displayName}
      </TableColumnValue>
      <TableColumnValue nowrap>{configuration.providerId}</TableColumnValue>
      <TableColumnValue title={configuration.description} ellipsis>
        {configuration.description || ''}
      </TableColumnValue>
      <TableColumnValue>
        <FieldCheckbox checked={configuration.disabled} disabled />
      </TableColumnValue>
      <TableColumnValue className={s(styles, { gap: true })} flex>
        <Loader suspense small inline hideMessage>
          <Placeholder container={service.configurationDetailsPlaceholder} configuration={configuration} />
        </Loader>
      </TableColumnValue>
    </TableItem>
  );
});
