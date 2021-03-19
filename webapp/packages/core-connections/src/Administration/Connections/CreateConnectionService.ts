/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { TabsContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';

import type { IConnectionFormDataOptions } from '../../ConnectionForm/useConnectionFormData';
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
  data: IConnectionFormDataOptions | null;

  readonly tabsContainer: TabsContainer<void, ICreateMethodOptions>;

  constructor(
    private readonly connectionsAdministrationNavService: ConnectionsAdministrationNavService,
    private readonly administrationScreenService: AdministrationScreenService
  ) {
    makeObservable(this, {
      data: observable,
      disabled: observable,
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

  setCreateMethod(method?: string | null): void {
    if (!method) {
      const id = this.getDefault();

      if (!id) {
        return;
      }
      method = id;
    }
    this.activateMethod(method);
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

    this.activateMethod(defaultId);
  }

  setConnectionTemplate(config: ConnectionConfig, availableDrivers: string[]): void {
    this.data = {
      config,
      availableDrivers,
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

  private activateMethod(method: string) {
    this.tabsContainer.select(method);
    this.connectionsAdministrationNavService.navToCreate(method);
  }
}
