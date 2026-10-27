/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 * you may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */
import { runInAction } from 'mobx';
import { describe, expect, it, vi } from 'vitest';

import { AiDatabaseScope } from '@cloudbeaver/core-sdk';
import type { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { formSubmitContext, type IFormState } from '@cloudbeaver/core-ui';
import { ExecutionContext } from '@cloudbeaver/core-executor';
import type { ConnectionFormOptionsPart, IConnectionFormState } from '@cloudbeaver/plugin-connections';

import type { ConnectionInfoAiResource } from '../../ConnectionInfoAiResource.js';
import type { ConnectionInfoAiScopeResource } from '../../ConnectionInfoAiScopeResource.js';
import { ConnectionAiScopePart } from './ConnectionAiScopePart.js';

function setup(connected = true) {
  let settings = { scope: AiDatabaseScope.Custom, customObjectIds: [] as string[] };
  let outdated = false;
  const task = { addHandler: vi.fn(), execute: vi.fn() };
  const form = {
    submitTask: task,
    prepareTask: task,
    formatTask: task,
    validationTask: task,
    loadedTask: task,
    savingPromise: null,
  } as unknown as IFormState<IConnectionFormState>;
  const key = { projectId: 'project', connectionId: 'connection' };
  const save = vi.fn().mockResolvedValue(undefined);
  const resource = {
    load: vi.fn(() => {
      if (outdated) {
        settings = { scope: AiDatabaseScope.Custom, customObjectIds: ['saved-table'] };
        outdated = false;
      }
      return Promise.resolve(settings);
    }),
    markOutdated: () => {
      outdated = true;
    },
    isLoaded: () => true,
    isOutdated: () => outdated,
  };
  const part = new ConnectionAiScopePart(
    form,
    { connectionKey: key } as ConnectionFormOptionsPart,
    {
      load: vi.fn().mockResolvedValue({ scope: AiDatabaseScope.Custom }),
      save,
      isLoaded: () => true,
      isOutdated: () => false,
    } as unknown as ConnectionInfoAiResource,
    resource as unknown as ConnectionInfoAiScopeResource,
    { isConnected: () => connected } as unknown as ConnectionInfoResource,
  );
  return {
    part,
    resource,
    key,
    save,
    submit: () => {
      const contexts = new ExecutionContext(form);
      contexts.getContext(formSubmitContext).setSubmitOnNoChanges(true);
      return part.save(form, contexts);
    },
    setConnected: (value: boolean) => {
      connected = value;
    },
  };
}

describe('ConnectionAiScopePart refresh after connecting', () => {
  it('restores saved selections that were unresolved while disconnected', async () => {
    const { part, resource, setConnected } = setup(false);
    await part.load();
    expect(part.state.customObjectIds).toEqual([]);

    resource.markOutdated();
    expect(part.isOutdated()).toBe(false);
    expect(resource.load).not.toHaveBeenCalled();
    setConnected(true);
    expect(part.isOutdated()).toBe(true);
    await part.load();

    expect(part.state.customObjectIds).toEqual(['saved-table']);
    expect(part.isChanged).toBe(false);
    expect(part.isLoaded()).toBe(true);
    expect(part.isOutdated()).toBe(false);
  });

  it('does not reuse the previous scope snapshot after disconnect', async () => {
    const { part, resource, setConnected } = setup();
    resource.markOutdated();
    await part.load();
    expect(part.state.customObjectIds).toEqual(['saved-table']);
    resource.load.mockClear();

    setConnected(false);
    resource.markOutdated();
    await part.load();

    expect(resource.load).not.toHaveBeenCalled();
    expect(part.isLoaded()).toBe(true);
    expect(part.isOutdated()).toBe(false);
    expect(part.state.customObjectIds).toEqual([]);
    expect(part.initialState.customObjectIds).toEqual([]);
    expect(part.isChanged).toBe(false);
  });

  it('omits unresolved objects when saving changed settings while disconnected', async () => {
    const { part, save, submit, key } = setup(false);
    await part.load();
    runInAction(() => {
      part.state.scope = AiDatabaseScope.CurrentDatasource;
    });

    await submit();

    expect(save).toHaveBeenCalledWith(key, { scope: AiDatabaseScope.CurrentDatasource, customObjectIds: undefined });
  });

  it('sends an empty list when the loaded selection is explicitly cleared', async () => {
    const { part, resource, save, submit, key } = setup();
    resource.markOutdated();
    await part.load();
    runInAction(() => {
      part.state.customObjectIds = [];
    });

    await submit();

    expect(save).toHaveBeenCalledWith(key, { scope: AiDatabaseScope.Custom, customObjectIds: [] });
  });

  it('preserves unsaved selections when server settings are refreshed', async () => {
    const { part, resource } = setup();
    await part.load();
    runInAction(() => {
      part.state.customObjectIds = ['draft-table'];
    });

    resource.markOutdated();
    await part.load();

    expect(part.state.customObjectIds).toEqual(['draft-table']);
    expect(part.initialState.customObjectIds).toEqual(['saved-table']);
    expect(part.isChanged).toBe(true);
  });

  it('records loading errors so the dialog cannot open with stale selections', async () => {
    const { part, resource } = setup();
    await part.load();
    const error = new Error('Unable to load scope');
    resource.load.mockRejectedValueOnce(error);

    resource.markOutdated();
    await part.load();
    expect(part.exception).toBe(error);
  });
});
