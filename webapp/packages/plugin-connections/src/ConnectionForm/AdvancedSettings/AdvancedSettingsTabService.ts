/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';

import { ConnectionFormService } from '../ConnectionFormService.js';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';
import { isProviderPropertySupported } from './isProviderPropertySupported.js';

const AdvancedSettings = importLazyComponent(() => import('./AdvancedSettings.js').then(m => m.AdvancedSettings));

@injectable(() => [ConnectionFormService, DBDriverResource])
export class AdvancedSettingsTabService extends Bootstrap {
  constructor(
    private readonly connectionFormService: ConnectionFormService,
    private readonly dbDriverResource: DBDriverResource,
  ) {
    super();
  }

  override register(): void {
    this.connectionFormService.parts.add({
      key: 'advanced_settings',
      name: 'plugin_connections_connection_form_part_advanced',
      title: 'plugin_connections_connection_form_part_advanced',
      icon: '/icons/plugin_connection_bulleted_list.svg',
      order: 9,
      panel: () => AdvancedSettings,
      getLoader: (_, props) => {
        const optionsPart = props?.formState ? getConnectionFormOptionsPart(props.formState) : null;

        return getCachedMapResourceLoaderState(
          this.dbDriverResource,
          () => optionsPart?.state.driverId ?? null,
          () => ['includeProviderProperties'],
        );
      },
      isHidden: (_, props) => {
        if (!props) {
          return true;
        }

        if (this.connectionFormService.providerPropertiesContainer.getDisplayed(props).length > 0) {
          return false;
        }

        const optionsPart = getConnectionFormOptionsPart(props.formState);
        const driver = optionsPart.state.driverId ? this.dbDriverResource.get(optionsPart.state.driverId) : null;
        const configurationType = optionsPart.state.configurationType;

        if (configurationType === undefined) {
          return true;
        }

        return !driver?.providerProperties?.some(property => isProviderPropertySupported(property, configurationType));
      },
    });
  }
}
