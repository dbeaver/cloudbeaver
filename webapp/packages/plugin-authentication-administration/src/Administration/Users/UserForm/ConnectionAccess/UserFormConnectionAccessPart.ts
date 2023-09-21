/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import type { UsersResource } from '@cloudbeaver/core-authentication';
import { type AdminConnectionGrantInfo, AdminSubjectType } from '@cloudbeaver/core-sdk';
import { FormMode } from '@cloudbeaver/core-ui';
import { isArraysEqual } from '@cloudbeaver/core-utils';

import type { AdministrationUserFormState } from '../AdministrationUserFormState';
import { DATA_CONTEXT_USER_FORM_INFO_PART } from '../Info/DATA_CONTEXT_USER_FORM_INFO_PART';
import type { IUserFormConnectionAccessPart } from './IUserFormConnectionAccessPart';

export class UserFormConnectionAccessPart implements IUserFormConnectionAccessPart {
  grantedConnections: AdminConnectionGrantInfo[];
  selectedConnections: Map<string, boolean>;

  exception: Error | null;
  promise: Promise<any> | null;

  private loading: boolean;
  private loaded: boolean;

  constructor(private readonly formState: AdministrationUserFormState, private readonly usersResource: UsersResource) {
    this.grantedConnections = [];
    this.selectedConnections = new Map();
    this.exception = null;
    this.loading = false;
    this.loaded = false;
    this.promise = null;

    this.formState.submitTask.addHandler(this.save.bind(this));

    makeObservable<this, 'loading' | 'loaded'>(this, {
      grantedConnections: observable.shallow,
      selectedConnections: observable,
      exception: observable.ref,
      promise: observable.ref,
      loading: observable,
      loaded: observable,
    });
  }

  isLoading(): boolean {
    return this.loading;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  isError() {
    return this.exception !== null;
  }

  isChanged(): boolean {
    if (!this.loaded) {
      return false;
    }

    return !isArraysEqual(this.getSelectedConnections(), this.getGrantedConnections());
  }

  async load() {
    if (this.loading) {
      return this.promise;
    }

    this.promise = this.loader();
    this.promise.finally(() => {
      this.promise = null;
    });

    await this.promise;
  }

  async save() {
    if (!this.loaded) {
      return;
    }

    const userFormInfoPart = this.formState.dataContext.get(DATA_CONTEXT_USER_FORM_INFO_PART);

    if (this.formState.mode === FormMode.Edit) {
      this.grantedConnections = await this.usersResource.loadConnections(userFormInfoPart.state.userId);
    }

    if (!this.isChanged()) {
      return;
    }

    await this.usersResource.setConnections(userFormInfoPart.state.userId, this.getSelectedConnections());
    this.loaded = false;
  }

  private getGrantedConnections(): string[] {
    return this.grantedConnections.filter(connection => connection.subjectType !== AdminSubjectType.Team).map(connection => connection.dataSourceId);
  }

  private getSelectedConnections(): string[] {
    return Array.from(this.selectedConnections.entries())
      .filter(([_, value]) => value)
      .map(([key]) => key);
  }

  private async loader() {
    try {
      this.loading = true;
      const userFormInfoPart = this.formState.dataContext.get(DATA_CONTEXT_USER_FORM_INFO_PART);
      if (this.formState.mode === FormMode.Edit && userFormInfoPart.initialState.userId) {
        this.fillDefaultConfig(await this.usersResource.loadConnections(userFormInfoPart.initialState.userId));
      }
      this.loaded = true;
      this.exception = null;
    } catch (exception: any) {
      this.exception = exception;
    } finally {
      this.loading = false;
    }
  }

  private fillDefaultConfig(grantedConnections: AdminConnectionGrantInfo[]) {
    this.grantedConnections = grantedConnections;

    if (this.isChanged()) {
      return;
    }

    this.selectedConnections.clear();
    for (const connection of this.grantedConnections) {
      if (connection.subjectType !== AdminSubjectType.Team) {
        this.selectedConnections.set(connection.dataSourceId, true);
      }
    }
  }
}
