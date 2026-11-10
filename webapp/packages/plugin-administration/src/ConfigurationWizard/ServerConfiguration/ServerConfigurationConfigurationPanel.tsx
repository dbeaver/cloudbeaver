/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { ServerConfigurationSettingsForm } from './Form/ServerConfigurationSettingsForm.js';
import { getServerConfigurationFormPart } from './getServerConfigurationFormPart.js';
import type { ServerConfigurationFormProps } from './ServerConfigurationFormService.js';

export const ServerConfigurationConfigurationPanel = observer<ServerConfigurationFormProps>(function ServerConfigurationConfigurationPanel({
  formState,
  configurationWizard,
}) {
  const part = getServerConfigurationFormPart(formState);

  return <ServerConfigurationSettingsForm configurationWizard={configurationWizard} state={part.state} />;
});
