/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SyncExecutor } from '@cloudbeaver/core-executor';
import { ROOT_SETTINGS_GROUP, type SettingsGroup } from '@cloudbeaver/core-settings';
import type { ITreeData } from '@cloudbeaver/plugin-navigation-tree';

import { getSettingGroupId } from './getSettingGroupId.js';
import { useTreeScrollSync } from './useTreeScrollSync.js';

describe('useTreeScrollSync', () => {
  let host: HTMLDivElement;
  let root: Root;
  let groups: SettingsGroup[];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    groups = [];
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    for (const group of groups.toReversed()) {
      group.parent?.deleteSubGroup(group.id);
    }
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  async function renderSettings() {
    const first = ROOT_SETTINGS_GROUP.createSubGroup('First');
    const branch = ROOT_SETTINGS_GROUP.createSubGroup('Branch');
    const child1 = branch.createSubGroup('Child 1');
    const child2 = branch.createSubGroup('Child 2');
    const last = ROOT_SETTINGS_GROUP.createSubGroup('Last');
    groups = [first, branch, child1, child2, last];
    const states = new Map(groups.map(group => [group.id, { selected: group === first, expanded: false }]));
    const treeData: ITreeData = {
      rootId: ROOT_SETTINGS_GROUP.id,
      getNode: id => ({ name: ROOT_SETTINGS_GROUP.get(id)!.name }),
      getChildren: id => ROOT_SETTINGS_GROUP.get(id)!.subGroups.map(group => group.id),
      getUnfilteredChildren: id => ROOT_SETTINGS_GROUP.get(id)!.subGroups.map(group => group.id),
      getParent: id => ROOT_SETTINGS_GROUP.get(id)?.parent?.id ?? null,
      getState: id => states.get(id)!,
      updateState: vi.fn<ITreeData['updateState']>((id, state) => Object.assign(states.get(id)!, state)),
      updateAllState: vi.fn<ITreeData['updateAllState']>(state => {
        for (const current of states.values()) {
          Object.assign(current, state);
        }
      }),
      load: vi.fn(async () => {}),
      update: vi.fn(async () => {}),
    };
    const executor = new SyncExecutor<string>();
    const onSettingsOpen = vi.fn();
    let notifyResize = () => {};
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          notifyResize = () => callback([{ target: host.firstElementChild! } as ResizeObserverEntry], this);
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );

    function SettingsContent() {
      const ref = useTreeScrollSync('test', treeData, executor, onSettingsOpen);
      return (
        <div ref={ref}>
          {groups.map(group => (
            <div key={group.id} id={getSettingGroupId('test', group.id)} />
          ))}
        </div>
      );
    }

    await act(() => root.render(<SettingsContent />));
    const container = host.firstElementChild as HTMLDivElement;
    const elements = Array.from(container.children);
    const offsets = [0, 140, 140, 280, 420];
    for (const [index, element] of elements.entries()) {
      Object.defineProperties(element, {
        offsetTop: { value: offsets[index] },
        offsetHeight: { value: index === 1 ? 0 : 140 },
      });
    }
    // A 400px viewport and 25% trailing space limit scrolling to 260px,
    // leaving a child of the preceding branch above the requested last group.
    vi.spyOn(elements[4]!, 'scrollIntoView').mockImplementation(() => {
      container.scrollTop = 260;
    });
    executor.addHandler(() => elements[4]!.scrollIntoView());

    async function scrollTo(position: number) {
      await act(() => {
        container.scrollTop = position;
        container.dispatchEvent(new Event('scroll'));
        vi.advanceTimersByTime(60);
      });
    }

    async function activateLastGroup() {
      treeData.updateAllState({ selected: false });
      treeData.updateState(last.id, { selected: true });
      executor.execute(last.id);
      await scrollTo(container.scrollTop);
    }

    return { treeData, branch, child1, last, onSettingsOpen, notifyResize, scrollTo, activateLastGroup };
  }

  it('does not expand the preceding branch when activation scrolls to a group near the bottom', async () => {
    const { treeData, branch, last, onSettingsOpen, notifyResize, activateLastGroup } = await renderSettings();

    await activateLastGroup();
    await act(() => {
      notifyResize();
      vi.advanceTimersByTime(60);
    });

    expect(treeData.getState(branch.id).expanded).toBe(false);
    expect(treeData.getState(last.id).selected).toBe(true);
    expect(onSettingsOpen).not.toHaveBeenCalled();
  });

  it('resumes synchronization when the user scrolls away from the activated group', async () => {
    const { treeData, branch, child1, onSettingsOpen, scrollTo, activateLastGroup } = await renderSettings();
    await activateLastGroup();
    onSettingsOpen.mockClear();

    await scrollTo(150);

    expect(treeData.getState(branch.id).expanded).toBe(true);
    expect(treeData.getState(child1.id).selected).toBe(true);
    expect(onSettingsOpen).toHaveBeenCalledExactlyOnceWith(child1.id);
  });
});
