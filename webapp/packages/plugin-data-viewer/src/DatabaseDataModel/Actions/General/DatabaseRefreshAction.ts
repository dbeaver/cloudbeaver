/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { DatabaseDataAction } from '../../DatabaseDataAction.js';
import { IDatabaseDataResult } from '../../IDatabaseDataResult.js';
import { IDatabaseDataSource } from '../../IDatabaseDataSource.js';

export interface IDatabaseRefreshState {
  interval: number;
  paused: boolean;
  stopOnError: boolean;
}

export class DatabaseRefreshActionImpl<TResult extends IDatabaseDataResult> extends DatabaseDataAction<any, TResult> {
  static dataFormat: ResultDataFormat[] | null = null;

  get isAutoRefresh(): boolean {
    return this.state.interval > 0;
  }

  get interval(): number {
    return this.state.interval;
  }

  get paused(): boolean {
    return this.state.paused;
  }

  get stopOnError(): boolean {
    return this.state.stopOnError;
  }

  private state: IDatabaseRefreshState;
  private timer: ReturnType<typeof setInterval> | null;
  constructor(source: IDatabaseDataSource<any, TResult>, result: TResult) {
    super(source, result);
    this.state = observable({ interval: 0, paused: false, stopOnError: true });
    this.timer = null;
  }

  setInterval(interval: number): void {
    this.state.interval = interval;

    if (this.state.interval) {
      this.startTimer();
      this.resume();
    } else {
      this.stopTimer();
    }
  }

  setStopOnError(stopOnError: boolean): void {
    this.state.stopOnError = stopOnError;
  }

  pause(): void {
    this.state.paused = true;
  }

  resume(): void {
    this.state.paused = false;
  }

  override dispose(): void {
    this.stopTimer();
  }

  private stopTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private startTimer(): void {
    if (this.state.interval <= 0) {
      return;
    }

    if (this.timer) {
      this.stopTimer();
    }

    this.timer = setTimeout(this.refresh.bind(this), this.state.interval);
  }

  private async refresh(): Promise<void> {
    if (this.state.paused) {
      this.startTimer();
      return;
    }

    try {
      await this.source.refreshData();
      this.startTimer();
    } catch {
      if (this.state.stopOnError) {
        this.setInterval(0);
      } else {
        this.startTimer();
      }
    }
  }
}

export type DatabaseRefreshAction<TResult extends IDatabaseDataResult> = DatabaseRefreshActionImpl<TResult>;

export class DatabaseRefreshActionDI extends Context.Service<DatabaseRefreshActionDI, DatabaseRefreshActionImpl<any>>()(
  '@cloudbeaver/plugin-data-viewer/DatabaseDataModel/Actions/General/DatabaseRefreshAction#DatabaseRefreshAction',
) {
  static readonly implementation = DatabaseRefreshActionImpl;
  static readonly dataFormat = DatabaseRefreshActionImpl.dataFormat;
  static readonly dependencies = () => [IDatabaseDataSource, IDatabaseDataResult] as const;
  static readonly make: Effect.Effect<
    DatabaseRefreshActionImpl<any>,
    never,
    Context.Service.Identifier<typeof IDatabaseDataSource> | Context.Service.Identifier<typeof IDatabaseDataResult>
  > = Effect.gen(function* makeDatabaseRefreshAction() {
    const source = yield* IDatabaseDataSource;
    const result = yield* IDatabaseDataResult;

    return new DatabaseRefreshActionImpl(source, result);
  });
  static readonly layer: Layer.Layer<
    DatabaseRefreshActionDI,
    never,
    Context.Service.Identifier<typeof IDatabaseDataSource> | Context.Service.Identifier<typeof IDatabaseDataResult>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DatabaseRefreshAction = DatabaseRefreshActionDI;
