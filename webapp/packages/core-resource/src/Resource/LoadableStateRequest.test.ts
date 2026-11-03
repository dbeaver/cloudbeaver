/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';

import { type CachedDataResource, getCachedDataResourceLoaderState } from './CachedDataResource.js';
import { type CachedMapResource, getCachedMapResourceLoaderState } from './CachedMapResource.js';
import { type CachedTreeResource, getCachedTreeResourceLoaderState } from './CachedTreeResource/CachedTreeResource.js';

function resource() {
  return {
    load: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
    refresh: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
    getException: vi.fn<(...args: unknown[]) => null>().mockReturnValue(null),
    isLoaded: vi.fn<(...args: unknown[]) => boolean>().mockReturnValue(false),
    isLoading: vi.fn<(...args: unknown[]) => boolean>().mockReturnValue(false),
    isOutdated: vi.fn<(...args: unknown[]) => boolean>().mockReturnValue(false),
    isEqual: vi.fn((first: unknown, second: unknown) => first === second),
  };
}

describe('Loadable state requests', () => {
  it('binds map loading, retry and state reads to the captured target', async () => {
    const source = resource();
    let key = 'first';
    const loader = getCachedMapResourceLoaderState(source as unknown as CachedMapResource<string, unknown>, () => key, undefined, true);
    const request = loader.captureRequest!();
    expect(request.isCurrent()).toBe(true);
    expect(request.state.lazy).toBe(true);
    key = 'second';
    expect(request.isCurrent()).toBe(false);
    await request.state.load();
    await request.state.reload!();
    request.state.isLoaded();
    request.state.isLoading();
    request.state.isOutdated!();
    void request.state.exception;
    expect(source.load).toHaveBeenCalledWith('first', undefined);
    expect(source.refresh).toHaveBeenCalledWith('first', undefined);
    expect(source.isLoaded).toHaveBeenCalledWith('first', undefined);
    expect(source.isLoading).toHaveBeenCalledWith('first');
    expect(source.isOutdated).toHaveBeenCalledWith('first', undefined);
    expect(source.getException).toHaveBeenCalledWith('first');
    await loader.load();
    expect(source.load).toHaveBeenLastCalledWith('second', undefined);
  });

  it('uses resource key equality for equivalent object keys', () => {
    const source = resource();
    source.isEqual.mockImplementation((first, second) => {
      const a = first as { projectId: string; id: string };
      const b = second as typeof a;
      return a.projectId === b.projectId && a.id === b.id;
    });
    let key = { projectId: 'project', id: 'connection' };
    const loader = getCachedMapResourceLoaderState(source as unknown as CachedMapResource<typeof key, unknown>, () => key);
    const request = loader.captureRequest!();
    key = { projectId: 'project', id: 'connection' };
    expect(request.isCurrent()).toBe(true);
    key = { projectId: 'other-project', id: 'connection' };
    expect(request.isCurrent()).toBe(false);
  });

  it('captures includes by value and ignores their ordering', async () => {
    const source = resource();
    const includes = ['includeName', 'includePermissions'];
    const loader = getCachedMapResourceLoaderState(
      source as unknown as CachedMapResource<string, unknown>,
      () => 'key',
      () => includes,
    );
    const request = loader.captureRequest!();
    includes.reverse();
    expect(request.isCurrent()).toBe(true);
    includes.push('includeOther');
    expect(request.isCurrent()).toBe(false);
    await request.state.load();
    expect(source.load).toHaveBeenCalledWith('key', ['includeName', 'includePermissions']);
  });

  it('keeps a null target idle and does not read its includes', async () => {
    const source = resource();
    let key: string | null = null;
    const includes = vi.fn(() => ['includeName']);
    const loader = getCachedMapResourceLoaderState(source as unknown as CachedMapResource<string, unknown>, () => key, includes);
    const request = loader.captureRequest!();
    expect(request.isCurrent()).toBe(true);
    expect(request.state.isLoaded()).toBe(true);
    await request.state.load();
    expect(source.load).not.toHaveBeenCalled();
    expect(includes).not.toHaveBeenCalled();
    key = 'connection';
    expect(request.isCurrent()).toBe(false);
  });

  it('binds data resource operations to the captured includes', async () => {
    const source = resource();
    const includes = ['includeName'];
    const loader = getCachedDataResourceLoaderState(
      source as unknown as CachedDataResource<unknown>,
      () => undefined,
      () => includes,
    );
    const request = loader.captureRequest!();
    includes.push('includeOther');
    expect(request.isCurrent()).toBe(false);
    await request.state.load();
    await request.state.reload!();
    expect(source.load).toHaveBeenCalledWith(undefined, ['includeName']);
    expect(source.refresh).toHaveBeenCalledWith(undefined, ['includeName']);
  });

  it('binds tree resource operations to the captured includes', async () => {
    const source = resource();
    const includes = ['includeName'];
    const loader = getCachedTreeResourceLoaderState(source as unknown as CachedTreeResource<unknown>, 'root', includes);
    const request = loader.captureRequest!();
    includes.push('includeOther');
    expect(request.isCurrent()).toBe(false);
    await request.state.load();
    await request.state.reload!();
    expect(source.load).toHaveBeenCalledWith('root', ['includeName']);
    expect(source.refresh).toHaveBeenCalledWith('root', ['includeName']);
  });
});
