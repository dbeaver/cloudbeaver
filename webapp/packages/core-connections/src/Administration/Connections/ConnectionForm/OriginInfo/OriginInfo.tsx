/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { TextPlaceholder, useTab, ObjectPropertyInfoForm, FormBox, FormBoxElement, FormGroup, InputGroup, Loader, useTabState, ExceptionMessage } from '@cloudbeaver/core-blocks';
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
  loaded: boolean;
  exception: Error | null;
}

export const OriginInfo: TabContainerPanelComponent<IConnectionFormProps> = observer(function OriginInfo({
  tabId,
  model,
}) {
  const translate = useTranslate();
  const connectionsResource = useService(ConnectionsResource);
  const state = useTabState<IState>(() => ({
    properties: [],
    state: {},
    loading: false,
    loaded: false,
    exception: null,
  }));

  const load = async () => {
    if (state.loaded) {
      return;
    }
    state.loading = true;
    state.exception = null;

    try {
      const properties = await connectionsResource.loadOrigin(model.connection.id);
      const propertiesState = {} as Record<string, any>;
      for (const property of properties) {
        propertiesState[property.id!] = property.value;
      }
      state.properties = properties;
      state.state = propertiesState;
      state.loaded = true;
    } catch (error) {
      state.exception = error;
    } finally {
      state.loading = false;
    }
  };

  useTab(tabId, load);

  if (state.loading) {
    return (
      <FormBox>
        <Loader />
      </FormBox>
    );
  }

  if (state.exception) {
    return (
      <FormBox>
        <ExceptionMessage exception={state.exception} onRetry={load} />
      </FormBox>
    );
  }

  if (state.properties.length === 0) {
    return (
      <FormBox>
        <TextPlaceholder>{translate('connections_administration_connection_no_information')}</TextPlaceholder>
      </FormBox>
    );
  }

  return (
    <FormBox>
      <FormBoxElement>
        <FormGroup><br /></FormGroup>
        <ObjectPropertyInfoForm
          properties={state.properties}
          credentials={state.state}
          editable={false}
          autoHide
        />
      </FormBoxElement>
      <Loader loading={state.loading} overlay />
    </FormBox>
  );
});
