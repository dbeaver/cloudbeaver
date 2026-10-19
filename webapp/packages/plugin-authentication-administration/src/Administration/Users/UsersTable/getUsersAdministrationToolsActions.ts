/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { TranslateFn } from '@cloudbeaver/core-localization';
import type { IMenuData, MenuActionItem, MenuBaseItem } from '@cloudbeaver/core-view';

interface UsersAdministrationToolAction {
  id: string;
  icon?: string;
  label: string;
  title: string;
  disabled: boolean;
  isLoading?: () => boolean;
  onClick: () => void;
}

export function getUsersAdministrationToolsActions(
  items: Array<MenuActionItem | MenuBaseItem>,
  context: IMenuData['context'],
  translate: TranslateFn,
): UsersAdministrationToolAction[] {
  return items.flatMap(item => {
    if (item.hidden) {
      return [];
    }

    if ('action' in item) {
      const info = item.action.actionInfo;

      return [
        {
          id: item.id,
          icon: info.icon,
          label: translate(info.label),
          title: translate(info.tooltip ?? info.label),
          disabled: item.disabled,
          isLoading: () => item.action.isLoading(),
          onClick: () => {
            item.events?.onSelect?.(context);
            item.action.activate();
          },
        },
      ];
    }

    return [
      {
        id: item.id,
        icon: item.icon,
        label: translate(item.label),
        title: translate(item.tooltip ?? item.label),
        disabled: item.disabled,
        onClick: () => item.events?.onSelect?.(context),
      },
    ];
  });
}
