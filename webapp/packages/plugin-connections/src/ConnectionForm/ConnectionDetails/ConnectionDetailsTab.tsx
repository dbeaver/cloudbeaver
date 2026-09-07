/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import React from 'react';

import { Translate } from '@cloudbeaver/core-blocks';
import { Tab, type TabContainerTabComponent, TabIcon, TabTitle } from '@cloudbeaver/core-ui';

import type { IConnectionFormProps } from '../IConnectionFormState.js';

export const ConnectionDetailsTab: TabContainerTabComponent<IConnectionFormProps> = function ConnectionDetailsTab(props) {
  return (
    <React.Fragment>
      <div className="theme-border-color-background tw:mx-2 tw:my-2 tw:shrink-0 tw:border-t" aria-hidden />
      <Tab {...props}>
        <TabIcon icon="/icons/plugin_connection_key.svg" viewBox="0 0 16 16" />
        <TabTitle>
          <Translate token="plugin_connections_connection_form_connection_details" />
        </TabTitle>
      </Tab>
    </React.Fragment>
  );
};
