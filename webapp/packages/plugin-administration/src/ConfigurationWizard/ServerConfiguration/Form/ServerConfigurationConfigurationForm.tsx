/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useTranslate } from '@cloudbeaver/core-blocks';

import { ServerConfigurationFeature } from '../Features/ServerConfigurationFeature.js';
import type { IServerConfig } from '../IServerConfigurationFormPartState.js';

interface Props {
  serverConfig: IServerConfig;
}

export const ServerConfigurationConfigurationForm = observer<Props>(function ServerConfigurationConfigurationForm({ serverConfig }) {
  const translate = useTranslate();

  if (serverConfig.customConnectionsEnabled == null) {
    return null;
  }

  return (
    <>
      <ServerConfigurationFeature
        state={serverConfig}
        name="customConnectionsEnabled"
        description={translate('administration_configuration_wizard_configuration_custom_connections_description')}
      >
        {translate('administration_configuration_wizard_configuration_custom_connections')}
      </ServerConfigurationFeature>
    </>
  );
});
