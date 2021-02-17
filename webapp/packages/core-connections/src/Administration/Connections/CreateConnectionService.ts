/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable, makeObservable } from 'mobx';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { TabsContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import type { IConnectionFormData } from '../../ConnectionForm/ConnectionFormService';
import { DBDriver, DBDriverResource } from '../../DBDriverResource';
import { ConnectionsAdministrationNavService } from './ConnectionsAdministrationNavService';

export interface ICreateMethodOptions {
  configurationWizard?: {
    activationPriority?: number;
  };
  close?: () => void;
}

@injectable()
export class CreateConnectionService {
  disabled = false;
  data: IConnectionFormData | null;

  get driver(): DBDriver | undefined {
    if (!this.data?.config.driverId) {
      return;
    }

    return this.dbDriverResource.get(this.data?.config.driverId);
  }

  readonly tabsContainer: TabsContainer<any, ICreateMethodOptions>;

  constructor(
    private readonly dbDriverResource: DBDriverResource,
    private readonly connectionsAdministrationNavService: ConnectionsAdministrationNavService,
    private readonly administrationScreenService: AdministrationScreenService
  ) {
    makeObservable(this, {
      data: observable,
      disabled: observable,
      driver: computed,
    });

    this.data = null;
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

  cancelCreate(): void {
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

  setConnectionTemplate(config: ConnectionConfig, availableDrivers: string[]): void {
    this.data = {
      config,
      availableDrivers,
      partsState: new MetadataMap<string, any>(),
    };
  }

  clearConnectionTemplate(): void {
    this.data = null;
  }

  close(): void {
    this.clearConnectionTemplate();
    for (const method of this.tabsContainer.tabInfoList) {
      method.options?.close?.();
    }
  }
}
