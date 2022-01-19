/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export type TabPanelElement = React.FunctionComponent<any> | (() => React.ReactElement | null);

export interface ITab {
  tabId: string;
  title: string;
  icon?: string;

  onClose?: () => void;
  onActivate: () => void;

  panel: TabPanelElement;
}

export interface ITabContainer {
  tabs: ITab[];
  currentTabId: string | null;
}
