/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { ServerConfigurationFeatureGroupsService } from '@cloudbeaver/core-administration';
import { useResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { FeaturesResource, sortFeature } from '@cloudbeaver/core-root';

import type { IConfigurationPlaceholderProps } from '../ServerConfigurationService.js';
import { ServerConfigurationFeature } from './ServerConfigurationFeature.js';

export interface IServerConfigurationFeatureListProps extends IConfigurationPlaceholderProps {
  groupId?: string;
}

export const ServerConfigurationFeatureList = observer<IServerConfigurationFeatureListProps>(function ServerConfigurationFeatureList({
  groupId,
  state,
  configurationWizard,
}) {
  const featuresResource = useResource(ServerConfigurationFeatureList, FeaturesResource, configurationWizard ? null : undefined);
  const serverConfigurationFeatureGroupsService = useService(ServerConfigurationFeatureGroupsService);
  const features = featuresResource.data.slice().sort(sortFeature);

  if (configurationWizard || features.length === 0) {
    return null;
  }

  return (
    <>
      {features
        .filter(feature => serverConfigurationFeatureGroupsService.featureGroups.get(feature.id) === groupId)
        .map(feature => (
          <ServerConfigurationFeature
            key={feature.id}
            state={state.serverConfig}
            name="enabledFeatures"
            value={feature.id}
            disabled={featuresResource.resource.isBase(feature.id)}
            description={feature.description}
          >
            {feature.label}
          </ServerConfigurationFeature>
        ))}
    </>
  );
});
