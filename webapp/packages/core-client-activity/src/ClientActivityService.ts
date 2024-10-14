/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { Executor, type IExecutor } from '@cloudbeaver/core-executor';

export const INACTIVE_PERIOD_TIME = 1000 * 60;

@injectable()
export class ClientActivityService {
  private timer: ReturnType<typeof setTimeout> | null;
  public isActive: boolean;
  public onActiveStateChange: IExecutor<boolean>;

  constructor() {
    this.setActivity = this.setActivity.bind(this);
    this.updateActivity = this.updateActivity.bind(this);
    this.resetActivity = this.resetActivity.bind(this);

    this.timer = null;
    this.isActive = false;
    this.onActiveStateChange = new Executor();

    makeObservable(this, {
      isActive: observable,
    });
  }

  private setActivity(value: boolean) {
    this.isActive = value;
    this.onActiveStateChange.execute(value);
  }

  resetActivity() {
    this.setActivity(false);

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  updateActivity() {
    this.setActivity(true);

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(this.resetActivity, INACTIVE_PERIOD_TIME);
  }
}
