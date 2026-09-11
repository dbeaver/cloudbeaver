/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect, useRef } from 'react';

import { useExecutor } from '@cloudbeaver/core-blocks';
import type { ISyncExecutor } from '@cloudbeaver/core-executor';
import { ROOT_SETTINGS_GROUP } from '@cloudbeaver/core-settings';
import { throttle } from '@cloudbeaver/core-utils';
import type { ITreeData } from '@cloudbeaver/plugin-navigation-tree';

import { getSettingGroupIdFromElementId } from './getSettingGroupIdFromElementId.js';
import { querySettingsGroups } from './querySettingsGroups.js';

export function useTreeScrollSync(
  settingsId: string,
  treeData: ITreeData,
  groupSelectExecutor: ISyncExecutor<string>,
  onSettingsOpen?: (groupId: string) => void,
): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);
  const programmaticScrollTop = useRef<number | null>(null);

  useExecutor({
    executor: groupSelectExecutor,
    postHandlers: [
      () => {
        // SettingsGroup handlers have already scrolled to the activated group.
        programmaticScrollTop.current = ref.current?.scrollTop ?? null;
      },
    ],
  });

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const syncScroll = throttle(function syncScroll(e: { target: Element | EventTarget | null }) {
      const container = e.target as HTMLDivElement;

      // Near the bottom, the activated group may not be the first visible one.
      if (container.scrollTop === programmaticScrollTop.current) {
        return;
      }
      programmaticScrollTop.current = null;

      const elements = querySettingsGroups(container);
      let firstVisibleElement: HTMLElement | undefined;

      for (const element of elements) {
        if (element.offsetTop + element.offsetHeight > container.scrollTop) {
          firstVisibleElement = element;
          break;
        }
      }

      if (firstVisibleElement) {
        const groupId = getSettingGroupIdFromElementId(settingsId, firstVisibleElement.id);
        let group = ROOT_SETTINGS_GROUP.get(groupId)!;

        treeData.updateAllState({ selected: false, expanded: false });
        treeData.updateState(groupId, { selected: true });

        while (group.parent && group.parent !== ROOT_SETTINGS_GROUP) {
          treeData.updateState(group.parent.id, { expanded: true });
          group = group.parent;
        }
        onSettingsOpen?.(groupId);
      }
    }, 50);

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        syncScroll({ target: entry.target });
      }
    });

    resizeObserver.observe(element);

    element.addEventListener('scroll', syncScroll);

    return () => {
      resizeObserver.disconnect();
      element.removeEventListener('scroll', syncScroll);
    };
  });

  return ref;
}
