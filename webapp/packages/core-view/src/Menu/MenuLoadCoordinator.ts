/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { autorun, computed, makeObservable, observable, runInAction } from 'mobx';

import { type ILoadableState, PromiseExecutor } from '@cloudbeaver/core-utils';

import { type IMenuLoadRequest, isSameMenuLoadRequest } from './IMenuLoadRequest.js';

interface IMenuLoadFailure {
  readonly request: IMenuLoadRequest;
  readonly error: Error;
}

interface IMenuRetry {
  readonly session: object;
  readonly getRequests: () => readonly IMenuLoadRequest[];
  readonly result: PromiseExecutor<void>;
}

function pending(state: ILoadableState): boolean {
  return !state.isLoaded() || state.isOutdated?.() === true;
}

/** One execution lifecycle for a tree. Menu policies supply demand, not the runner. */
export class MenuLoadCoordinator {
  private session: object | null = null;
  private failures: IMenuLoadFailure[] = [];
  private readonly retries: IMenuRetry[] = [];
  private task: PromiseExecutor<void> | undefined;
  private scheduled = false;
  private requested = false;

  constructor(private readonly getRequests: () => readonly IMenuLoadRequest[]) {
    makeObservable<this, 'session' | 'failures'>(this, {
      session: observable.ref,
      failures: observable.ref,
      started: computed,
    });
  }

  get started(): boolean {
    return this.session !== null;
  }

  start(): () => void {
    if (this.started) {
      throw new Error('Menu loading is already started');
    }
    const session = {};
    runInAction(() => {
      this.session = session;
    });
    const dispose = autorun(() => {
      if (this.getRequests().some(request => this.canLoad(request))) {
        this.schedule();
      }
    });
    return () => {
      dispose();
      if (this.session !== session) {
        return;
      }
      runInAction(() => {
        this.session = null;
        this.failures = [];
      });
      this.requested = false;
      for (const retry of this.retries.splice(0)) {
        retry.result.resolve(undefined);
      }
    };
  }

  failureFor(requests: readonly IMenuLoadRequest[]): Error | null {
    return this.failures.find(failure => requests.some(request => isSameMenuLoadRequest(request, failure.request)))?.error ?? null;
  }

  /** Wait for the current drain, including demand and retries added while it runs. */
  load(): Promise<void> {
    if (!this.started) {
      return Promise.resolve();
    }
    this.requested = true;
    if (this.task) {
      return this.task.promise;
    }
    const task = new PromiseExecutor<void>();
    this.task = task;
    // Install the task before loading: synchronous state updates may request another pass.
    void this.drain().then(
      () => {
        this.task = undefined;
        task.resolve(this.started && this.requested ? this.load() : undefined);
      },
      error => {
        this.task = undefined;
        task.reject(error);
      },
    );
    return task.promise;
  }

  /** Resolve the scope after waiting; a successful retry waits for the resulting drain. */
  retry(getRequests: () => readonly IMenuLoadRequest[]): Promise<void> {
    if (!this.session) {
      return Promise.resolve();
    }
    const result = new PromiseExecutor<void>();
    this.retries.push({ session: this.session, getRequests, result });
    void this.load();
    return result.promise;
  }

  private schedule(): void {
    this.requested = true;
    if (this.task || this.scheduled) {
      return;
    }
    this.scheduled = true;
    queueMicrotask(() => {
      this.scheduled = false;
      if (this.started && this.requested) {
        void this.load();
      }
    });
  }

  private canLoad(request: IMenuLoadRequest): boolean {
    const state = request.target.state;
    return request.target.isCurrent() && !this.failureFor([request]) && pending(state) && !state.isError() && state.isLoadable?.() !== false;
  }

  private isActive(request: IMenuLoadRequest, session: object): boolean {
    return this.session === session && request.target.isCurrent() && this.getRequests().some(active => isSameMenuLoadRequest(active, request));
  }

  private async execute(request: IMenuLoadRequest, session: object, operation: () => void | Promise<void>): Promise<void> {
    try {
      await operation();
    } catch (error) {
      if (this.isActive(request, session)) {
        const active = this.getRequests();
        runInAction(() => {
          this.failures = [
            ...this.failures.filter(
              failure => active.some(item => isSameMenuLoadRequest(item, failure.request)) && !isSameMenuLoadRequest(request, failure.request),
            ),
            { request, error: error instanceof Error ? error : new Error(String(error)) },
          ];
        });
      }
      throw error;
    }
  }

  private async runRetry(retry: IMenuRetry): Promise<void> {
    try {
      const requests = retry.getRequests();
      for (const request of requests) {
        const state = request.target.state;
        if (this.isActive(request, retry.session) && state.isError() && state.reload) {
          await this.execute(request, retry.session, () => state.reload!());
        }
      }
      runInAction(() => {
        this.failures = this.failures.filter(failure => !requests.some(request => isSameMenuLoadRequest(request, failure.request)));
      });
      retry.result.resolve(this.task?.promise);
    } catch (error) {
      retry.result.reject(error);
    } finally {
      // Every retry rejoins the same demand loop, including failures and target switches.
      this.requested = true;
    }
  }

  private async drain(): Promise<void> {
    while (this.session && (this.requested || this.retries.length > 0)) {
      this.requested = false;
      const retry = this.retries.shift();
      if (retry) {
        await this.runRetry(retry);
        continue;
      }
      const session = this.session;
      for (const request of this.getRequests()) {
        if (!this.isActive(request, session) || !this.canLoad(request)) {
          continue;
        }
        try {
          await this.execute(request, session, () => request.target.state.load());
        } catch {
          // The failure belongs to this request; other current requests can proceed.
        }
      }
    }
  }
}
