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

export const ServerConfigurationWorkspaceSection: PlaceholderComponent<IConfigurationPlaceholderProps> = observer(
  function ServerConfigurationWorkspaceSection(props) {
    const translate = useTranslate();
    const serverConfigurationConfigurationService = useService(ServerConfigurationConfigurationService);

    return (
      <ServerConfigurationFeatureGroup title={translate('administration_server_configuration_settings_workspace')}>
        <Placeholder container={serverConfigurationConfigurationService.workspaceContainer} {...props} />
      </ServerConfigurationFeatureGroup>
    );
  },
);
