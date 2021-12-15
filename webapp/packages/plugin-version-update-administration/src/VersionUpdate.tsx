/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { AdministrationItemContentComponent, ADMINISTRATION_TOOLS_PANEL_STYLES } from '@cloudbeaver/core-administration';
import { TabsState, TabList, Tab, TabPanel, ToolsPanel, UNDERLINE_TAB_STYLES, BASE_CONTAINERS_STYLES, ColoredContainer, useMapResource } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';
import { VersionResource } from '@cloudbeaver/core-version';

import { EVersionUpdate } from './EVersionUpdate';
import { Instructions } from './Instructions';
import { VersionChecker } from './VersionChecker';
import { VersionSelector } from './VersionSelector';
import { VersionsTable } from './VersionsTable';

const tabsStyles = css`
  ColoredContainer {
    list-style-position: inside;
  }
  TabList {
    position: relative;
    flex-shrink: 0;
    align-items: center;
    height: 51px;
  }
  Tab {
    height: 46px!important;
    text-transform: uppercase;
    font-weight: 500 !important;
  }
  TabPanel {
    flex-direction: column;
  }
`;

export const VersionUpdate: AdministrationItemContentComponent = observer(function VersionUpdate() {
  const tabStyle = [tabsStyles, UNDERLINE_TAB_STYLES];
  const translate = useTranslate();
  const style = useStyles(ADMINISTRATION_TOOLS_PANEL_STYLES, BASE_CONTAINERS_STYLES, tabStyle);
  const versionResource = useMapResource(VersionUpdate, VersionResource, CachedMapAllKey);

  return styled(style)(
    <TabsState selectedId={EVersionUpdate.INFO} lazy>
      <ToolsPanel>
        <TabList style={style}>
          <Tab tabId={EVersionUpdate.INFO} style={style}>{translate('version_update_info')}</Tab>
          <Tab tabId={EVersionUpdate.VERSIONS} style={style}>{translate('versions')}</Tab>
        </TabList>
      </ToolsPanel>
      <TabPanel tabId={EVersionUpdate.INFO}>
        <ColoredContainer wrap gap overflow parent>
          <VersionChecker />
          <Instructions />
          <VersionSelector versions={versionResource.resource.values} />
        </ColoredContainer>
      </TabPanel>
      <TabPanel tabId={EVersionUpdate.VERSIONS}>
        <VersionsTable versions={versionResource.resource.values} />
      </TabPanel>
    </TabsState>
  );
});
