/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import { ServerConfigResource } from '@cloudbeaver/core-root';

import type { ILicensePageState } from './ILicensePageState';

export interface IValidationStatusContext {
  getState: () => boolean;
  invalidate: () => void;
}

@injectable()
export class AdministrationLicensePageService {
  state: ILicensePageState;
  loading: boolean;
  readonly validationTask: IExecutor<boolean>;

  constructor(
    private readonly administrationScreenService: AdministrationScreenService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly notificationService: NotificationService,
  ) {
    makeObservable(this, {
      state: observable,
      loading: observable,
    });

    this.loading = true;
    this.state = this.getConfig();
    this.validationTask = new Executor();
  }

  isDone(): boolean {
    return this.isFormFilled();
  }

  validationStatusContext = (): IValidationStatusContext => {
    let state = this.isFormFilled();

    const invalidate = () => {
      state = false;
    };
    const getState = () => state;

    return {
      getState,
      invalidate,
    };
  };

  async save(): Promise<boolean> {
    if (!this.state) {
      throw new Error('No state available');
    }

    if (!(await this.validate())) {
      return false;
    }

    return true;
  }

  async validate(): Promise<boolean> {
    const context = await this.validationTask.execute(true);
    const state = await context.getContext(this.validationStatusContext);

    return state.getState();
  }

  private isFormFilled() {
    if ((this.state?.license.length || 0) < 6) {
      return false;
    }
    return true;
  }

  async loadConfig(): Promise<void> {
    this.loading = true;
    try {
      const config = await this.serverConfigResource.load();

      this.state = this.administrationScreenService
        .getItemState(
          'license',
          this.getConfig.bind(this),
          !config?.configurationMode,
          value => {
            if (typeof value === 'object' && typeof value.license === 'string') {
              return true;
            }
            return false;
          }
        );
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load server configuration');
    } finally {
      this.loading = false;
    }
  }

  private getConfig(): ILicensePageState {
    return {
      license: '',
    };
  }
}
