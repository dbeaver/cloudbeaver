/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Placeholder, type PlaceholderComponent, s, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import styles from '../Features/ServerConfigurationFeatures.module.css';
import { ServerConfigurationConfigurationService } from '../ServerConfigurationConfigurationService.js';
import type { IConfigurationPlaceholderProps } from '../ServerConfigurationService.js';

export const ServerConfigurationSettingsForm: PlaceholderComponent<IConfigurationPlaceholderProps> = observer(
  function ServerConfigurationSettingsForm({ state, configurationWizard }) {
    const serverConfigurationConfigurationService = useService(ServerConfigurationConfigurationService);
    const classes = useS(styles);

    return (
      <div className={s(classes, { layout: true })}>
        <div className={s(classes, { grid: true })}>
          <Placeholder
            container={serverConfigurationConfigurationService.settingsContainer}
            state={state}
            configurationWizard={configurationWizard}
          />
        </div>
      </div>
    );
  },
);
