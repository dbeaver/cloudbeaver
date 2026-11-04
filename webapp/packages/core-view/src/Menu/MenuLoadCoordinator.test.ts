/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable, runInAction } from 'mobx';
import { describe, expect, it, vi } from 'vitest';

import { type ILoadableState, PromiseExecutor } from '@cloudbeaver/core-utils';

import { captureMenuLoadRequest } from './IMenuLoadRequest.js';
import { MenuLoadCoordinator } from './MenuLoadCoordinator.js';

function resource() {
  const state = observable({ loaded: false, error: null as Error | null });
  const loader = {
    get exception() {
      return state.error;
    },
    isLoaded: () => state.loaded,
    isLoading: () => false,
    isError: () => !!state.error,
    load: vi.fn(async () => {
      await Promise.resolve();
      runInAction(() => {
        state.loaded = true;
      });
    }),
    reload: vi.fn(async () => {
      await Promise.resolve();
      runInAction(() => {
        state.error = null;
        state.loaded = true;
      });
    }),
  };
  return { state, loader };
}

describe('MenuLoadCoordinator', () => {
  it('resolves queued retry demand after the in-flight load finishes', async () => {
    const first = resource();
    const second = resource();
    second.state.error = new Error('second failed');
    const gate = new PromiseExecutor<void>();
    first.loader.load.mockImplementation(() => gate.promise);
    const a = captureMenuLoadRequest({}, first.loader);
    const b = captureMenuLoadRequest({}, second.loader);
    const requests = observable.box([a], { deep: false });
    const coordinator = new MenuLoadCoordinator(() => requests.get());
    const stop = coordinator.start();
    const loading = coordinator.load();
    const retry = coordinator.retry(() => requests.get());
    runInAction(() => requests.set([b]));
    gate.resolve(undefined);
    await Promise.all([loading, retry]);
    expect(second.loader.reload).toHaveBeenCalledOnce();
    expect(second.loader.load).not.toHaveBeenCalled();
    expect(second.state.loaded).toBe(true);
    stop();
  });

  it("does not expose another owner's failure for the same loader", async () => {
    const source = resource();
    const failure = new Error('failed');
    source.loader.load.mockRejectedValue(failure);
    const first = captureMenuLoadRequest({}, source.loader);
    const second = captureMenuLoadRequest({}, source.loader);
    const coordinator = new MenuLoadCoordinator(() => [first]);
    const stop = coordinator.start();
    await coordinator.load();
    expect(coordinator.failureFor([first])).toBe(failure);
    expect(coordinator.failureFor([second])).toBeNull();
    stop();
  });

  it('executes supplied demand without applying menu lazy policies', async () => {
    const source = resource();
    const loader = { ...source.loader, lazy: true };
    const request = captureMenuLoadRequest({}, loader);
    const coordinator = new MenuLoadCoordinator(() => [request]);
    const stop = coordinator.start();
    await coordinator.load();
    expect(source.loader.load).toHaveBeenCalledOnce();
    expect(coordinator.started).toBe(true);
    stop();
    expect(coordinator.started).toBe(false);
  });

  it('isolates failures by owner and retries only on explicit request', async () => {
    const first = resource();
    const second = resource();
    const failure = new Error('first failed');
    first.loader.load.mockRejectedValue(failure);
    const a = captureMenuLoadRequest({}, first.loader);
    const b = captureMenuLoadRequest({}, second.loader);
    const coordinator = new MenuLoadCoordinator(() => [a, b]);
    const stop = coordinator.start();
    await coordinator.load();
    expect(coordinator.failureFor([a])).toBe(failure);
    expect(coordinator.failureFor([b])).toBeNull();
    expect(second.loader.load).toHaveBeenCalledOnce();
    await coordinator.load();
    expect(first.loader.load).toHaveBeenCalledOnce();
    first.loader.load.mockImplementation(async () => {
      await Promise.resolve();
      runInAction(() => {
        first.state.loaded = true;
      });
    });
    await coordinator.retry(() => [a]);
    expect(first.loader.load).toHaveBeenCalledTimes(2);
    expect(first.state.loaded).toBe(true);
    expect(coordinator.failureFor([a])).toBeNull();
    stop();
  });

  it('continues current demand after a retry for an old target rejects', async () => {
    const first = resource();
    const second = resource();
    first.state.error = new Error('first failed');
    const gate = new PromiseExecutor<void>();
    first.loader.reload.mockImplementation(() => gate.promise);
    const current = observable.box(first.loader, { deep: false });
    const scope = {};
    const loader: ILoadableState = {
      isLoaded: () => current.get().isLoaded(),
      isLoading: () => false,
      isError: () => current.get().isError(),
      load: () => current.get().load(),
      captureRequest() {
        const state = current.get();
        return { state, isCurrent: () => current.get() === state };
      },
    };
    const requests = () => [captureMenuLoadRequest(scope, loader)];
    const coordinator = new MenuLoadCoordinator(requests);
    const stop = coordinator.start();
    const failure = new Error('retry failed');
    const retry = coordinator.retry(requests);
    const rejected = expect(retry).rejects.toBe(failure);
    runInAction(() => current.set(second.loader));
    await Promise.resolve();
    gate.reject(failure);
    await rejected;
    await vi.waitFor(() => expect(second.loader.load).toHaveBeenCalledOnce());
    expect(coordinator.failureFor(requests())).toBeNull();
    stop();
  });

  it('serializes concurrent retries and skips one that has already recovered', async () => {
    const source = resource();
    source.state.error = new Error('failed');
    const gate = new PromiseExecutor<void>();
    source.loader.reload.mockImplementation(async () => {
      await gate.promise;
      runInAction(() => {
        source.state.error = null;
        source.state.loaded = true;
      });
    });
    const request = captureMenuLoadRequest({}, source.loader);
    const coordinator = new MenuLoadCoordinator(() => [request]);
    const stop = coordinator.start();
    const first = coordinator.retry(() => [request]);
    const second = coordinator.retry(() => [request]);
    expect(source.loader.reload).toHaveBeenCalledOnce();
    gate.resolve(undefined);
    await Promise.all([first, second]);
    expect(source.loader.reload).toHaveBeenCalledOnce();
    expect(source.loader.load).not.toHaveBeenCalled();
    stop();
  });

  it('shares one in-flight drain across explicit loads', async () => {
    const first = resource();
    const second = resource();
    const gate = new PromiseExecutor<void>();
    first.loader.load.mockImplementation(async () => {
      await gate.promise;
      runInAction(() => {
        first.state.loaded = true;
      });
    });
    const requests = [captureMenuLoadRequest({}, first.loader), captureMenuLoadRequest({}, second.loader)];
    const coordinator = new MenuLoadCoordinator(() => requests);
    const stop = coordinator.start();
    const one = coordinator.load();
    const two = coordinator.load();
    expect(one).toBe(two);
    expect(second.loader.load).not.toHaveBeenCalled();
    gate.resolve(undefined);
    await one;
    expect(first.loader.load).toHaveBeenCalledOnce();
    expect(second.loader.load).toHaveBeenCalledOnce();
    stop();
  });

  it('settles queued retries on disposal without executing them', async () => {
    const first = resource();
    const second = resource();
    second.state.error = new Error('failed');
    const gate = new PromiseExecutor<void>();
    first.loader.load.mockImplementation(() => gate.promise);
    const a = captureMenuLoadRequest({}, first.loader);
    const b = captureMenuLoadRequest({}, second.loader);
    const coordinator = new MenuLoadCoordinator(() => [a, b]);
    const stop = coordinator.start();
    const loading = coordinator.load();
    const retry = coordinator.retry(() => [b]);
    stop();
    await retry;
    expect(second.loader.reload).not.toHaveBeenCalled();
    gate.resolve(undefined);
    await loading;
    expect(coordinator.started).toBe(false);
  });

  it('ignores an old session failure and resumes demand after restarting', async () => {
    const first = resource();
    const second = resource();
    const gate = new PromiseExecutor<void>();
    first.loader.load.mockImplementation(() => gate.promise);
    const a = captureMenuLoadRequest({}, first.loader);
    const b = captureMenuLoadRequest({}, second.loader);
    const requests = observable.box([a], { deep: false });
    const coordinator = new MenuLoadCoordinator(() => requests.get());
    const stop = coordinator.start();
    const loading = coordinator.load();
    stop();
    runInAction(() => requests.set([b]));
    const stopAgain = coordinator.start();
    gate.reject(new Error('old session failed'));
    await loading;
    expect(second.loader.load).toHaveBeenCalledOnce();
    expect(coordinator.failureFor([a, b])).toBeNull();
    stopAgain();
  });

  it('leaves blocked resources pending without repeatedly attempting them', async () => {
    const source = resource();
    const request = captureMenuLoadRequest({}, { ...source.loader, isLoadable: () => false });
    const coordinator = new MenuLoadCoordinator(() => [request]);
    const stop = coordinator.start();
    await coordinator.load();
    expect(source.loader.load).not.toHaveBeenCalled();
    expect(coordinator.failureFor([request])).toBeNull();
    stop();
  });
});
