/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../DatabaseDataAction';
import type { IDatabaseDataResult } from '../IDatabaseDataResult';
import type { IDatabaseDataSource } from '../IDatabaseDataSource';
import { databaseDataAction } from './DatabaseDataActionDecorator';

export interface IDatabaseRefreshState {
  interval: number;
  paused: boolean;
  stopOnError: boolean;
}

@databaseDataAction()
export class DatabaseRefreshAction<TResult extends IDatabaseDataResult> extends DatabaseDataAction<any, TResult> {
  static dataFormat: ResultDataFormat[] | null = null;

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
  constructor(source: IDatabaseDataSource<any, TResult>) {
    super(source);
    this.state = observable({ interval: 0, paused: false, stopOnError: true });
    this.timer = null;
  }

  setInterval(interval: number): void {
    this.state.interval = interval;

    if (this.state.interval) {
      this.startTimer();
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

  dispose(): void {
    this.stopTimer();
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private startTimer(): void {
    if (this.timer) {
      this.stopTimer();
    }
    this.resume();
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
    } catch (exception) {
      if (this.state.stopOnError) {
        this.stopTimer();
      } else {
        this.startTimer();
      }
    }
  }
}
