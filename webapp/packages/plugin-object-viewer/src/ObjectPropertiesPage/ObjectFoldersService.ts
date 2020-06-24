/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action } from 'mobx';

import { TabEntity } from '@cloudbeaver/core-app';
import { ITab } from '@cloudbeaver/core-blocks';
import { Entity, injectable, RootContainerService } from '@cloudbeaver/core-di';

import { ObjectFoldersTabService } from './ObjectFoldersTab/ObjectFoldersTabService';
import { ObjectFoldersTabContainer } from './ObjectFoldersTabsContainer/ObjectFoldersTabContainer';
import { ObjectInfoTabService } from './ObjectInfoTab/ObjectInfoTabService';
import { VirtualFolderTabService } from './VirtualFolderTab/VirtualFolderTabService';

export interface ITabBuilder {
  build: (objectId: string) => ITab | ITab[] | null;
}

@injectable()
export class ObjectFoldersService {

  private tabBuilders: ITabBuilder[] = [];

  // todo temporary solution while only ObjectFolders supports entities
  // later it will be integrated in common lifecycle of nested entities
  private tabContainersStorage = new Entity();

  constructor(
    private objectInfoTabService: ObjectInfoTabService,
    private virtualFolderTabService: VirtualFolderTabService,
    private objectFoldersTabService: ObjectFoldersTabService,
    private rootContainerService: RootContainerService
  ) {
    this.rootContainerService.registerEntityInRootContainer(this.tabContainersStorage);
  }

  @action
  createTabsContainer(nodeId: string): ObjectFoldersTabContainer {
    const tabContainer = new ObjectFoldersTabContainer(nodeId);
    this.tabContainersStorage.addChild(tabContainer);

    const infoTab = this.objectInfoTabService.createTabEntity(nodeId);
    if (infoTab) {
      tabContainer.addTabEntity(infoTab);
    }

    this.objectFoldersTabService.createTabEntities(nodeId)
      .forEach(tabEntity => tabContainer.addTabEntity(tabEntity));

    this.virtualFolderTabService.createTabEntities(nodeId)
      .forEach(tabEntity => tabContainer.addTabEntity(tabEntity));

    const tabs = this.getTabs(nodeId);
    tabs.forEach((tab) => {
      const tabEntity = new TabEntity(tab);
      tabContainer.addTabEntity(tabEntity);
    });
    return tabContainer;
  }

  destroyTabContainer(nodeId: string) {
    this.tabContainersStorage.removeChild(nodeId);
  }

  /**
   * return tabs that should be created once for node id
   * @param nodeId
   */
  getTabs(nodeId: string): ITab[] {
    const tabList: ITab[] = [];
    this.tabBuilders.forEach((builder) => {
      const tab = builder.build(nodeId);
      if (tab) {
        const tabs = Array.isArray(tab) ? tab : [tab];
        tabList.push(...tabs);
      }
    });
    return tabList;
  }

  registerTabConstructor(tabBuilder: ITabBuilder) {
    this.tabBuilders.push(tabBuilder);
  }
}
