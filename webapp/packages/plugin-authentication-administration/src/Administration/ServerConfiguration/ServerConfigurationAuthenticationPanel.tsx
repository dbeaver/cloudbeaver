/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Container } from '@cloudbeaver/core-blocks';
import { getServerConfigurationFormPart, type ServerConfigurationFormProps } from '@cloudbeaver/plugin-administration';

import { AuthenticationProviders } from './AuthenticationProviders.js';

export const ServerConfigurationAuthenticationPanel = observer<ServerConfigurationFormProps>(function ServerConfigurationAuthenticationPanel({
  formState,
  configurationWizard,
}) {
  const part = getServerConfigurationFormPart(formState);

  return (
    <Container wrap gap grid medium keepSize>
      <AuthenticationProviders configurationWizard={configurationWizard} state={part.state} />
    </Container>
  );
});
