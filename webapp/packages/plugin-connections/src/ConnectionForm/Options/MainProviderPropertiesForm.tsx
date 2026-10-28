/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { ObjectPropertyInfoForm, useResource } from '@cloudbeaver/core-blocks';
import { ConnectionInfoAuthPropertiesResource, DBDriverResource } from '@cloudbeaver/core-connections';

import type { ConnectionFormContainerProps } from '../ConnectionFormService.js';
import { isConnectionFormReadOnly } from '../isConnectionFormReadOnly.js';
import { getMainProviderProperties } from '../providerProperties.js';
import { getConnectionFormOptionsPart } from './getConnectionFormOptionsPart.js';

export const MainProviderPropertiesForm = observer<ConnectionFormContainerProps>(function MainProviderPropertiesForm({ formState }) {
  const optionsPart = getConnectionFormOptionsPart(formState);
  const driver = useResource(MainProviderPropertiesForm, DBDriverResource, {
    key: optionsPart.state.driverId || null,
    includes: ['includeProviderProperties'] as const,
  });
  const authProperties = useResource(MainProviderPropertiesForm, ConnectionInfoAuthPropertiesResource, optionsPart.connectionKey);
  const properties = getMainProviderProperties(driver.data, optionsPart.state.configurationType);

  if (!properties.length) {
    return null;
  }

  return (
    <div className="tw:flex tw:min-w-0 tw:flex-col tw:gap-4">
      <ObjectPropertyInfoForm
        properties={properties}
        state={optionsPart.state.providerProperties}
        disabled={formState.isDisabled}
        readOnly={isConnectionFormReadOnly(formState, authProperties.data?.authModel)}
      />
    </div>
  );
});
