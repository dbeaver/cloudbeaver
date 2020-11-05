/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { UsersResource } from '@cloudbeaver/core-authentication';
import { TextPlaceholder, useTab, ObjectPropertyInfoForm, FormBox, FormBoxElement, FormGroup, InputGroup, Loader } from '@cloudbeaver/core-blocks';
import { TabContainerPanelComponent } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

import { ConnectionsResource } from '../../../ConnectionsResource';
import { IConnectionFormProps } from '../ConnectionFormService';

interface IState {
  properties: ObjectPropertyInfo[];
  state: Record<string, any>;
  loading: boolean;
}

export const OriginInfo: TabContainerPanelComponent<IConnectionFormProps> = observer(function OriginInfo({
  tabId,
  model,
  controller,
}) {
  const translate = useTranslate();
  const connectionsResource = useService(ConnectionsResource);

  useTab(tabId, async () => {
    if (controller.metadata.has(tabId)) {
      return;
    }
    controller.metadata.set(tabId, { properties: [], state: {}, loading: true });

    const properties = await connectionsResource.loadOrigin(model.connection.id);
    const propertiesState = {} as Record<string, any>;
    for (const property of properties) {
      propertiesState[property.id!] = property.value;
    }
    controller.metadata.set(tabId, { properties, state: propertiesState, loading: false });
  });

  const state: IState = controller.metadata.get(tabId) || { properties: [], state: {}, loading: false };

  if (state.properties.length === 0) {
    return (
      <FormBox>
        <TextPlaceholder>{translate('authentication_administration_user_connections_empty')}</TextPlaceholder>
        <Loader loading={state.loading} overlay />
      </FormBox>
    );
  }

  return (
    <FormBox>
      <FormBoxElement>
        <FormGroup>
          <InputGroup>{translate('authentication_user_credentials')}</InputGroup>
        </FormGroup>
        <ObjectPropertyInfoForm
          properties={state.properties}
          credentials={state.state}
          readOnly
          autoHide
        />
      </FormBoxElement>
      <Loader loading={state.loading} overlay />
    </FormBox>
  );
});
