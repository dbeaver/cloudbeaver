/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Placeholder, type PlaceholderComponent, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { ServerConfigurationConfigurationService } from '../ServerConfigurationConfigurationService.js';
import type { IConfigurationPlaceholderProps } from '../ServerConfigurationService.js';
import { ServerConfigurationFeatureGroup } from './ServerConfigurationFeatureGroup.js';

export const ServerConfigurationConnectionsSection: PlaceholderComponent<IConfigurationPlaceholderProps> = observer(
  function ServerConfigurationConnectionsSection(props) {
    const translate = useTranslate();
    const serverConfigurationConfigurationService = useService(ServerConfigurationConfigurationService);

    return (
      <ServerConfigurationFeatureGroup title={translate('administration_server_configuration_settings_connections')}>
        <Placeholder container={serverConfigurationConfigurationService.connectionsContainer} {...props} />
      </ServerConfigurationFeatureGroup>
    );
  },
);
