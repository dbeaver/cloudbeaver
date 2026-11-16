/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  AdministrationItemService,
  type AdministrationItemContentProps,
  type AdministrationItemSubCanActivateEvent,
  type AdministrationItemSubEvent,
  type IAdministrationItem,
} from '@cloudbeaver/core-administration';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { TabsContainer, type ITabInfoOptions } from '@cloudbeaver/core-ui';

import { ADMINISTRATION_CONNECTIONS_ITEM } from './ADMINISTRATION_CONNECTIONS_ITEM.js';

const ConnectionsAdministration = importLazyComponent(() => import('./ConnectionsAdministration.js').then(m => m.ConnectionsAdministration));

const ConnectionsDrawerItem = importLazyComponent(() => import('./ConnectionsDrawerItem.js').then(m => m.ConnectionsDrawerItem));

export interface IConnectionsTabOptions extends ITabInfoOptions<AdministrationItemContentProps> {
  onActivate?: AdministrationItemSubEvent;
  onDeActivate?: AdministrationItemSubEvent;
  canActivate?: AdministrationItemSubCanActivateEvent;
  canDeActivate?: AdministrationItemSubCanActivateEvent;
}

export class ConnectionsAdministrationTabServiceImpl {
  readonly tabsContainer: TabsContainer<AdministrationItemContentProps>;

  private item!: IAdministrationItem;

  constructor(private readonly administrationItemService: AdministrationItemService) {
    this.tabsContainer = new TabsContainer('Connections administration tabs');
  }

  addSubTab({ onActivate, onDeActivate, canActivate, canDeActivate, ...tabInfo }: IConnectionsTabOptions): void {
    this.tabsContainer.add(tabInfo);

    if (!this.item.sub.some(sub => sub.name === tabInfo.key)) {
      this.item.sub.push({ name: tabInfo.key, onActivate, onDeActivate, canActivate, canDeActivate });
    }

    this.item.defaultSub ??= tabInfo.key;
  }

  createRootTab(): void {
    this.item = this.administrationItemService.create({
      name: ADMINISTRATION_CONNECTIONS_ITEM,
      order: 7,
      isHidden: () => this.item.sub.length === 0,
      getContentComponent: () => ConnectionsAdministration,
      getDrawerComponent: () => ConnectionsDrawerItem,
    });
  }
}

export type ConnectionsAdministrationTabService = ConnectionsAdministrationTabServiceImpl;

export class ConnectionsAdministrationTabServiceDI extends Context.Service<
  ConnectionsAdministrationTabServiceDI,
  ConnectionsAdministrationTabServiceImpl
>()('@cloudbeaver/plugin-connection-administration/ConnectionsAdministrationTabService#ConnectionsAdministrationTabService') {
  static readonly implementation = ConnectionsAdministrationTabServiceImpl;

  static readonly dependencies = () => [AdministrationItemService] as const;
  static readonly make: Effect.Effect<ConnectionsAdministrationTabServiceImpl, never, Context.Service.Identifier<typeof AdministrationItemService>> =
    Effect.gen(function* makeConnectionsAdministrationTabService() {
      const administrationItemService = yield* AdministrationItemService;

      return new ConnectionsAdministrationTabServiceImpl(administrationItemService);
    });
  static readonly layer: Layer.Layer<ConnectionsAdministrationTabServiceDI, never, Context.Service.Identifier<typeof AdministrationItemService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const ConnectionsAdministrationTabService = ConnectionsAdministrationTabServiceDI;
