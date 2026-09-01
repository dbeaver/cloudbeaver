/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useRef } from 'react';

import { Form, useFormValidator, useResource } from '@cloudbeaver/core-blocks';
import { ConnectionInfoAuthPropertiesResource, DBDriverExpertSettingsResource } from '@cloudbeaver/core-connections';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';

import { ConnectionSectionWrapper } from '../ConnectionSectionWrapper.js';
import type { IConnectionFormProps } from '../IConnectionFormState.js';
import { isConnectionFormReadOnly } from '../isConnectionFormReadOnly.js';
import { AdvancedPropertiesForm } from '../Options/AdvancedPropertiesForm.js';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';

export const InitializationSettings: TabContainerPanelComponent<IConnectionFormProps> = observer(function InitializationSettings({ formState }) {
  const formRef = useRef<HTMLFormElement>(null);
  const optionsPart = getConnectionFormOptionsPart(formState);
  const connectionInfoAuthResource = useResource(InitializationSettings, ConnectionInfoAuthPropertiesResource, optionsPart.connectionKey);
  const propertiesResource = useResource(InitializationSettings, DBDriverExpertSettingsResource, optionsPart.state.driverId ?? null);
  const readonly = isConnectionFormReadOnly(formState, connectionInfoAuthResource.data?.authModel);

  useFormValidator(formState.validationTask, formRef.current);

  return (
    <Form ref={formRef} className="tw:flex tw:flex-1 tw:overflow-auto" disabled={propertiesResource.isLoading()}>
      <ConnectionSectionWrapper>
        <AdvancedPropertiesForm config={optionsPart.state} disabled={formState.isDisabled} readonly={readonly} />
      </ConnectionSectionWrapper>
    </Form>
  );
});
