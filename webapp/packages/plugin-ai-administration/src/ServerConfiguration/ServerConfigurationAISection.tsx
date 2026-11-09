/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { type PlaceholderComponent, useTranslate } from '@cloudbeaver/core-blocks';
import { FEATURE_GROUP_AI_ID } from '@cloudbeaver/plugin-ai';
import {
  type IConfigurationPlaceholderProps,
  ServerConfigurationFeatureGroup,
  ServerConfigurationFeatureList,
} from '@cloudbeaver/plugin-administration';

export const ServerConfigurationAISection: PlaceholderComponent<IConfigurationPlaceholderProps> = observer(
  function ServerConfigurationAISection(props) {
    const translate = useTranslate();

    return (
      <ServerConfigurationFeatureGroup title={translate('administration_server_configuration_settings_ai')}>
        <ServerConfigurationFeatureList {...props} groupId={FEATURE_GROUP_AI_ID} />
      </ServerConfigurationFeatureGroup>
    );
  },
);
