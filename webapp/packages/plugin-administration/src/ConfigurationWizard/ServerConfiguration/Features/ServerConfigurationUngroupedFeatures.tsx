/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { type PlaceholderComponent, useTranslate } from '@cloudbeaver/core-blocks';

import type { IConfigurationPlaceholderProps } from '../ServerConfigurationService.js';
import { ServerConfigurationFeatureGroup } from './ServerConfigurationFeatureGroup.js';
import { ServerConfigurationFeatureList } from './ServerConfigurationFeatureList.js';

export const ServerConfigurationUngroupedFeatures: PlaceholderComponent<IConfigurationPlaceholderProps> = observer(
  function ServerConfigurationUngroupedFeatures(props) {
    const translate = useTranslate();

    return (
      <ServerConfigurationFeatureGroup title={translate('administration_configuration_wizard_configuration_services_group')}>
        <ServerConfigurationFeatureList {...props} />
      </ServerConfigurationFeatureGroup>
    );
  },
);
