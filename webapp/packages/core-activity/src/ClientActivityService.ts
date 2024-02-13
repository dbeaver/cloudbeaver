/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import { SessionResource } from '@cloudbeaver/core-root';

const SESSION_TOUCH_TIME_PERIOD = 1000 * 60;

@injectable()
export class ClientActivityService {
  private timer: NodeJS.Timeout | null;
  public isActive: boolean;
  public onActiveStateChange: IExecutor<boolean>;

  constructor(private readonly sessionResource: SessionResource) {
    this.setActivity.bind(this);
    this.updateActivity = this.updateActivity.bind(this);
    this.resetActivity = this.resetActivity.bind(this);

    this.timer = null;
    this.isActive = false;
    this.onActiveStateChange = new Executor();

    makeObservable(this, {
      isActive: observable,
    });
  }

  private setActivity = (value: boolean) => {
    this.isActive = value;
    this.onActiveStateChange.execute(value);
  };

  resetActivity() {
    this.setActivity(false);

    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    this.timer = null;
  }

  updateActivity(force?: boolean) {
    if (!this.isActive || force) {
      if (this.timer !== null) {
        clearTimeout(this.timer);
      }

      this.setActivity(true);
      this.sessionResource.touchSession();
      this.timer = setTimeout(this.resetActivity, SESSION_TOUCH_TIME_PERIOD);
    }
  }
}
