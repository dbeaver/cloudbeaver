/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Container } from '@cloudbeaver/core-blocks';

import { getServerConfigurationFormPart } from './getServerConfigurationFormPart.js';
import { ServerConfigurationDriversForm } from './ServerConfigurationDriversForm.js';
import type { ServerConfigurationFormProps } from './ServerConfigurationFormService.js';

export const ServerConfigurationDriversPanel = observer<ServerConfigurationFormProps>(function ServerConfigurationDriversPanel({ formState }) {
  const part = getServerConfigurationFormPart(formState);

  return (
    <Container wrap gap grid medium keepSize>
      <ServerConfigurationDriversForm initialServerConfig={part.initialState.serverConfig} serverConfig={part.state.serverConfig} />
    </Container>
  );
});
