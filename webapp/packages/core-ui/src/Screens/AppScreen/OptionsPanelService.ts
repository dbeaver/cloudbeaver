/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable, runInAction } from 'mobx';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { Executor, ExecutorInterrupter, type IExecutionContext, type IExecutor, type IExecutorHandler } from '@cloudbeaver/core-executor';

import { NavigationService } from './NavigationService.js';

export type OptionsPanelCloseEventData = 'before' | 'after';

export class OptionsPanelServiceImpl {
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

  async open(component: () => React.FC, setContext?: () => void): Promise<boolean> {
    if (!(await this.close())) {
      return false;
    }

    runInAction(() => {
      setContext?.();
      this.panelComponent = component;
      this.basePanelComponent = component;
      this.active = true;
    });

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

export type OptionsPanelService = OptionsPanelServiceImpl;

export class OptionsPanelServiceDI extends Context.Service<OptionsPanelServiceDI, OptionsPanelServiceImpl>()(
  '@cloudbeaver/core-ui/Screens/AppScreen/OptionsPanelService#OptionsPanelService',
) {
  static readonly implementation = OptionsPanelServiceImpl;

  static readonly dependencies = () => [NavigationService] as const;
  static readonly make: Effect.Effect<OptionsPanelServiceImpl, never, Context.Service.Identifier<typeof NavigationService>> = Effect.gen(
    function* makeOptionsPanelService() {
      const navigationService = yield* NavigationService;

      return new OptionsPanelServiceImpl(navigationService);
    },
  );
  static readonly layer: Layer.Layer<OptionsPanelServiceDI, never, Context.Service.Identifier<typeof NavigationService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const OptionsPanelService = OptionsPanelServiceDI;
