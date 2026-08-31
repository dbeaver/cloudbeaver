/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useRef } from 'react';

import { Form, Placeholder, useFormValidator, useResource } from '@cloudbeaver/core-blocks';
import { ConnectionInfoAuthPropertiesResource, DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';

import { ConnectionFormService } from '../ConnectionFormService.js';
import { ConnectionSectionWrapper } from '../ConnectionSectionWrapper.js';
import type { IConnectionFormProps } from '../IConnectionFormState.js';
import { isConnectionFormReadOnly } from '../isConnectionFormReadOnly.js';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';
import { ProviderPropertiesForm } from '../Options/ProviderPropertiesForm.js';

export const AdvancedSettings: TabContainerPanelComponent<IConnectionFormProps> = observer(function AdvancedSettings({ formState }) {
  const formRef = useRef<HTMLFormElement>(null);
  const connectionFormService = useService(ConnectionFormService);
  const optionsPart = getConnectionFormOptionsPart(formState);
  const connectionInfoAuthResource = useResource(AdvancedSettings, ConnectionInfoAuthPropertiesResource, optionsPart.connectionKey);
  const driverResource = useResource(AdvancedSettings, DBDriverResource, {
    key: optionsPart.state.driverId || null,
    includes: ['includeProviderProperties'] as const,
  });
  const readonly = isConnectionFormReadOnly(formState, connectionInfoAuthResource.data?.authModel);

  useFormValidator(formState.validationTask, formRef.current);

  return (
    <Form ref={formRef} className="tw:flex tw:flex-1 tw:overflow-auto" disabled={driverResource.isLoading()}>
      <ConnectionSectionWrapper>
        <Placeholder container={connectionFormService.providerPropertiesContainer} formState={formState} />
        {driverResource.data?.providerProperties && (
          <ProviderPropertiesForm formState={formState} properties={driverResource.data.providerProperties} readonly={readonly} />
        )}
      </ConnectionSectionWrapper>
    </Form>
  );
});
