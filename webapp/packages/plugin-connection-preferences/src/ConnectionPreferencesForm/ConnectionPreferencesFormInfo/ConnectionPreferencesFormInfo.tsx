/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { useTab, type TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { useAutoLoad } from '@cloudbeaver/core-blocks';

import type { IConnectionPreferencesFormProps } from '../IConnectionPreferencesFormState.js';
import { getConnectionPreferencesFormInfoPart } from './getConnectionPreferencesFormInfoPart.js';


export const ConnectionPreferencesFormInfo: TabContainerPanelComponent<IConnectionPreferencesFormProps> = observer(function ConnectionPreferencesFormInfo({ formState, tabId }) {
  const infoPart = getConnectionPreferencesFormInfoPart(formState);
  const tab = useTab(tabId);

  useAutoLoad(ConnectionPreferencesFormInfo, infoPart, tab.selected);

  return (
    <div>
      {infoPart.state.name}
    </div>
  );
});