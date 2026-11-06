/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import type { PlaceholderComponent } from '@cloudbeaver/core-blocks';

import { ServerConfigurationConfigurationForm } from '../Form/ServerConfigurationConfigurationForm.js';
import { ServerConfigurationNavigatorViewForm } from '../Form/ServerConfigurationNavigatorViewForm.js';
import type { IConfigurationPlaceholderProps } from '../ServerConfigurationService.js';
import { ServerConfigurationFeatureList } from './ServerConfigurationFeatureList.js';
import { SERVER_CONFIGURATION_FEATURE_GROUPS } from './SERVER_CONFIGURATION_FEATURE_GROUPS.js';

export const ServerConfigurationConnectionFeatures: PlaceholderComponent<IConfigurationPlaceholderProps> = observer(
  function ServerConfigurationConnectionFeatures(props) {
    return (
      <>
        <ServerConfigurationConfigurationForm serverConfig={props.state.serverConfig} />
        <ServerConfigurationNavigatorViewForm configs={props.state} />
        <ServerConfigurationFeatureList {...props} groupId={SERVER_CONFIGURATION_FEATURE_GROUPS.connections} />
      </>
    );
  },
);
