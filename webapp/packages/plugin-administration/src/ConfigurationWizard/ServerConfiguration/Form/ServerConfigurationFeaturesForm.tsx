/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import styled from 'reshadow';

import { AdministrationSettingsService } from '@cloudbeaver/core-administration';
import { BASE_CONTAINERS_STYLES, FormContext, GroupTitle, PlaceholderComponent, Switch, useResource, useTranslate, useStyles } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { FeaturesResource } from '@cloudbeaver/core-root';
import type { IConfigurationPlaceholderProps } from '@cloudbeaver/plugin-administration';

export const ServerConfigurationFeaturesForm: PlaceholderComponent<IConfigurationPlaceholderProps> = observer(function ServerConfigurationFeaturesForm({
  state: { serverConfig },
  configurationWizard,
}) {
  const formContext = useContext(FormContext);

  if (formContext === null) {
    throw new Error('Form state should be provided');
  }

  const administrationSettingsService = useService(AdministrationSettingsService);
  const features = useResource(
    ServerConfigurationFeaturesForm,
    FeaturesResource,
    configurationWizard ? null : undefined
  );
  const translate = useTranslate();
  const styles = useStyles(BASE_CONTAINERS_STYLES);

  if (features.data.length === 0 || configurationWizard) {
    return null;
  }

  return styled(styles)(
    <>
      <GroupTitle>{translate('administration_configuration_wizard_configuration_services_group')}</GroupTitle>
      {features.data.map(feature => (
        <Switch
          key={feature.id}
          value={feature.id}
          name="enabledFeatures"
          state={serverConfig}
          description={feature.description}
          disabled={administrationSettingsService.isBase(feature.id)}
          mod={['primary']}
          small
        >
          {feature.label}
        </Switch>
      ))}
    </>
  );
});
