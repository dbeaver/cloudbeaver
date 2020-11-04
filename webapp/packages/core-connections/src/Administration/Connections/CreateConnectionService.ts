/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { TabsContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { AdminConnectionGrantInfo } from '@cloudbeaver/core-sdk';

import { DBDriver, DBDriverResource } from '../../DBDriverResource';
import { AdminConnection } from '../ConnectionsResource';
import { ConnectionsAdministrationNavService } from './ConnectionsAdministrationNavService';

export interface ICreateMethodOptions {
  configurationWizard?: {
    activationPriority?: number;
  };
  close?: () => void;
}

@injectable()
export class CreateConnectionService {
  @observable disabled = false;
  @observable connection: AdminConnection | null;
  @observable availableDrivers: string[];
  @observable credentials: Record<string, string | number>;
  @observable grantedSubjects: AdminConnectionGrantInfo[] | null;

  @computed get driver(): DBDriver | undefined {
    if (!this.connection?.driverId) {
      return;
    }

    return this.dbDriverResource.get(this.connection.driverId);
  }

  readonly tabsContainer: TabsContainer<any, ICreateMethodOptions>;

  constructor(
    private readonly dbDriverResource: DBDriverResource,
    private readonly connectionsAdministrationNavService: ConnectionsAdministrationNavService,
    private readonly administrationScreenService: AdministrationScreenService
  ) {
    this.credentials = {};
    this.availableDrivers = [];
    this.grantedSubjects = null;
    this.connection = null;
    this.tabsContainer = new TabsContainer();

    this.setConnectionTemplate = this.setConnectionTemplate.bind(this);
    this.clearConnectionTemplate = this.clearConnectionTemplate.bind(this);
    this.setCreateMethod = this.setCreateMethod.bind(this);
    this.cancelCreate = this.cancelCreate.bind(this);
    this.create = this.create.bind(this);
  }

  getDefault(): string | null {
    if (this.tabsContainer.tabInfoList.length === 0) {
      return null;
    }
    if (this.administrationScreenService.isConfigurationMode) {
      const sorted = this.tabsContainer.tabInfoList.sort((a, b) => {
        const aPriority = a.options?.configurationWizard?.activationPriority || Number.MAX_SAFE_INTEGER;
        const bPriority = b.options?.configurationWizard?.activationPriority || Number.MAX_SAFE_INTEGER;

        return aPriority - bPriority;
      });

      return sorted[0].key;
    }
    return this.tabsContainer.tabInfoList[0].key;
  }

  setCreateMethod(method?: string): void {
    if (!method) {
      const id = this.getDefault();

      if (!id) {
        return;
      }
      method = id;
    }
    this.connectionsAdministrationNavService.navToCreate(method);
  }

  cancelCreate(): void{
    this.clearConnectionTemplate();
    this.connectionsAdministrationNavService.navToRoot();
  }

  create(): void {
    const defaultId = this.getDefault();
    if (!defaultId) {
      return;
    }

    this.connectionsAdministrationNavService.navToCreate(defaultId);
  }

  setConnectionTemplate(connection: AdminConnection, drivers: string[]): void {
    this.connection = connection;
    this.availableDrivers = drivers;
  }

  clearConnectionTemplate(): void {
    this.connection = null;
    this.availableDrivers = [];
    this.credentials = {};
    this.grantedSubjects = null;
  }

  close(): void {
    this.clearConnectionTemplate();
    for (const method of this.tabsContainer.tabInfoList) {
      method.options?.close?.();
    }
  }
}
