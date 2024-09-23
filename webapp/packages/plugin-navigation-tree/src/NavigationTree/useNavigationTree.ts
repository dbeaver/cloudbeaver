/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { NavNode } from '@cloudbeaver/core-navigation-tree';

import { NavigationTreeService } from './NavigationTreeService.js';

interface INavigationTree {
  navigationTreeService: NavigationTreeService;
  handleOpen: (node: NavNode, folder: boolean) => Promise<void>;
  handleSelect: (node: NavNode, state: boolean) => void;
  handleSelectReset: () => void;
}

const bindActions: Array<keyof INavigationTree> = ['handleOpen', 'handleSelect', 'handleSelectReset'];

export function useNavigationTree(): INavigationTree {
  const navigationTreeService = useService(NavigationTreeService);
  const notificationService = useService(NotificationService);

  return useObjectRef<INavigationTree>(
    () => ({
      navigationTreeService,
      async handleOpen(node: NavNode, folder: boolean) {
        if (!folder) {
          try {
            await this.navigationTreeService.navToNode(node.id, node.parentId);
          } catch (exception: any) {
            notificationService.logException(exception);
            throw exception;
          }
        }
      },
      handleSelect(node: NavNode, state: boolean) {
        return this.navigationTreeService.selectNode(node.id, state);
      },
      handleSelectReset() {
        this.navigationTreeService.unselectAll();
      },
    }),
    { navigationTreeService },
    bindActions,
  );
}
