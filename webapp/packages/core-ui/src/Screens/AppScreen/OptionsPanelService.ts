/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { Executor, ExecutorInterrupter, type IExecutionContext, type IExecutor, type IExecutorHandler } from '@cloudbeaver/core-executor';

import { NavigationService } from './NavigationService.js';

export type OptionsPanelCloseEventData = 'before' | 'after';

@injectable()
export class OptionsPanelService {
  active: boolean;
  readonly closeTask: IExecutor<OptionsPanelCloseEventData>;

  panelComponent: (() => React.FC) | null;
  private basePanelComponent: (() => React.FC) | null;

  constructor(private readonly navigationService: NavigationService) {
    this.active = false;
    this.panelComponent = null;
    this.basePanelComponent = null;
    this.closeTask = new Executor();
    this.navigationService.navigationTask.addHandler(this.navigationHandler);

    makeObservable(this, {
      active: observable,
      panelComponent: observable,
    });
  }

  isOpen(component: () => React.FC): boolean {
    return this.basePanelComponent === component;
  }

  getPanelComponent(): React.FC {
    if (this.panelComponent === null) {
      return () => null;
    }
    return this.panelComponent();
  }

  async open(component: () => React.FC): Promise<boolean> {
    if (!(await this.close())) {
      return false;
    }

    this.panelComponent = component;
    this.basePanelComponent = component;
    this.active = true;
    return true;
  }

  async close(context?: IExecutionContext<any>): Promise<boolean> {
    if (this.panelComponent === null) {
      return true;
    }

    const contexts = await this.closeTask.execute('before', context);

    const interrupted = contexts.getContext(ExecutorInterrupter.interruptContext);

    if (interrupted.interrupted) {
      return false;
    }

    await this.closeTask.execute('after', context);

    this.panelComponent = null;
    this.basePanelComponent = null;
    this.active = false;

    return true;
  }

  private readonly navigationHandler: IExecutorHandler<any> = async (data, contexts) => {
    const state = await this.close();

    if (!state) {
      ExecutorInterrupter.interrupt(contexts);
    }
  };
}
