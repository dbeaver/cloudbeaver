/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ActionService, DATA_CONTEXT_MENU, menuExtractActions, MenuSeparatorItem, MenuService } from '@cloudbeaver/core-view';

import { ACTION_TAB_CLOSE } from './Actions/ACTION_TAB_CLOSE';
import { ACTION_TAB_CLOSE_ALL } from './Actions/ACTION_TAB_CLOSE_ALL';
import { ACTION_TAB_CLOSE_ALL_TO_THE_LEFT } from './Actions/ACTION_TAB_CLOSE_ALL_TO_THE_LEFT';
import { ACTION_TAB_CLOSE_ALL_TO_THE_RIGHT } from './Actions/ACTION_TAB_CLOSE_ALL_TO_THE_RIGHT';
import { ACTION_TAB_CLOSE_OTHERS } from './Actions/ACTION_TAB_CLOSE_OTHERS';
import { DATA_CONTEXT_TAB_ID } from './Tab/DATA_CONTEXT_TAB_ID';
import { DATA_CONTEXT_TABS_CONTEXT } from './Tab/DATA_CONTEXT_TABS_CONTEXT';
import { MENU_TAB } from './Tab/MENU_TAB';

@injectable()
export class TabsBootstrap extends Bootstrap {
  constructor(
    private readonly actionService: ActionService,
    private readonly menuService: MenuService
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.actionService.addHandler({
      id: 'tabs-base-handler',
      isActionApplicable: (context, action) => {
        const menu = context.find(DATA_CONTEXT_MENU, MENU_TAB);
        const state = context.tryGet(DATA_CONTEXT_TABS_CONTEXT);
        const tab = context.tryGet(DATA_CONTEXT_TAB_ID);

        if (!menu || !state?.tabList || !tab) {
          return false;
        }

        if (action === ACTION_TAB_CLOSE_OTHERS || action === ACTION_TAB_CLOSE_ALL) {
          return state.tabList.length > 1;
        }

        if (action === ACTION_TAB_CLOSE_ALL_TO_THE_LEFT || action === ACTION_TAB_CLOSE_ALL_TO_THE_RIGHT) {
          const index = state.tabList.indexOf(tab);

          if (index === -1) {
            return false;
          }

          if (action === ACTION_TAB_CLOSE_ALL_TO_THE_LEFT) {
            return index > 0;
          }

          return index < state.tabList.length - 1;
        }

        return [ACTION_TAB_CLOSE].includes(action);
      },
      handler: async (context, action) => {
        const state = context.get(DATA_CONTEXT_TABS_CONTEXT);
        const tab = context.get(DATA_CONTEXT_TAB_ID);

        switch (action) {
          case ACTION_TAB_CLOSE:
            state.close(tab);
            break;
          case ACTION_TAB_CLOSE_OTHERS:
            state.closeOthers(tab);
            break;
          case ACTION_TAB_CLOSE_ALL:
            state.closeAll();
            break;
          case ACTION_TAB_CLOSE_ALL_TO_THE_LEFT:
            state.closeAllToTheDirection(tab, 'left');
            break;
          case ACTION_TAB_CLOSE_ALL_TO_THE_RIGHT:
            state.closeAllToTheDirection(tab, 'right');
            break;
          default:
            break;
        }
      },
    });

    this.menuService.addCreator({
      isApplicable: context => {
        const state = context.tryGet(DATA_CONTEXT_TABS_CONTEXT);
        return !!state?.enabledBaseActions && context.get(DATA_CONTEXT_MENU) === MENU_TAB;
      },
      getItems: (context, items) => [
        ...items,
        ACTION_TAB_CLOSE,
        ACTION_TAB_CLOSE_ALL,
        ACTION_TAB_CLOSE_OTHERS,
        ACTION_TAB_CLOSE_ALL_TO_THE_LEFT,
        ACTION_TAB_CLOSE_ALL_TO_THE_RIGHT,
      ],
      orderItems: (context, items) => {
        const actions = menuExtractActions(items, [
          ACTION_TAB_CLOSE,
          ACTION_TAB_CLOSE_ALL,
          ACTION_TAB_CLOSE_OTHERS,
          ACTION_TAB_CLOSE_ALL_TO_THE_LEFT,
          ACTION_TAB_CLOSE_ALL_TO_THE_RIGHT,
        ]);

        if (actions.length > 0) {
          if (items.length > 0) {
            items.push(new MenuSeparatorItem());
          }
          items.push(...actions);
        }

        return items;
      },
    });
  }

  load(): void | Promise<void> { }
}