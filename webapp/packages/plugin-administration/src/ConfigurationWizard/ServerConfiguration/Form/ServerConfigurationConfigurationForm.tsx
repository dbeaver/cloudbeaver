/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Switch, useTranslate } from '@cloudbeaver/core-blocks';
import type { ServerConfigInput } from '@cloudbeaver/core-sdk';

interface Props {
  serverConfig: ServerConfigInput;
}

export const ServerConfigurationConfigurationForm = observer<Props>(function ServerConfigurationConfigurationForm({ serverConfig }) {
  const translate = useTranslate();
  return (
    <>
      <Switch
        name="customConnectionsEnabled"
        state={serverConfig}
        description={translate('administration_configuration_wizard_configuration_custom_connections_description')}
        mod={['primary']}
        small
        autoHide
      >
        {translate('administration_configuration_wizard_configuration_custom_connections')}
      </Switch>
    </>
  );
});
