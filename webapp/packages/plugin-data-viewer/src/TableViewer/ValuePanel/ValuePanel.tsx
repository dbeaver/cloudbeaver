/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { TabList, TabPanelList, TabsState, UNDERLINE_TAB_STYLES } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import type { DataPresentationComponent } from '../../DataPresentationService';
import { DataValuePanelService } from './DataValuePanelService';

const styles = composes(
  css`
    Tab {
      composes: theme-ripple from global;
    }
    TabList {
      composes: theme-background-surface theme-text-on-surface from global;
    }
  `,
  css`
    table-left-bar {
      display: flex;
    }
    Tab {
      composes: theme-typography--body2 from global;
      text-transform: uppercase;
      font-weight: normal;

      &:global([aria-selected=true]) {
        font-weight: normal !important;
      }
    }
    TabList tab-outer:only-child {
      display: none;
    }
  `
);

export const ValuePanel: DataPresentationComponent<any, IDatabaseResultSet> = observer(function ValuePanel({
  dataFormat,
  model,
  resultIndex,
}) {
  const service = useService(DataValuePanelService);

  return styled(useStyles(styles, UNDERLINE_TAB_STYLES))(
    <TabsState container={service.tabs} dataFormat={dataFormat} model={model} resultIndex={resultIndex} lazy>
      <TabList style={[styles, UNDERLINE_TAB_STYLES]} />
      <TabPanelList style={[styles, UNDERLINE_TAB_STYLES]} />
    </TabsState>
  );
});
