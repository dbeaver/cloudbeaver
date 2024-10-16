/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { MenuCustomItem, MenuService } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_DV_DDM } from '../../../../DatabaseDataModel/DataContext/DATA_CONTEXT_DV_DDM.js';
import { DATA_CONTEXT_DV_DDM_RESULT_INDEX } from '../../../../DatabaseDataModel/DataContext/DATA_CONTEXT_DV_DDM_RESULT_INDEX.js';
import { DATA_VIEWER_DATA_MODEL_ACTIONS_MENU } from '../DATA_VIEWER_DATA_MODEL_ACTIONS_MENU.js';

const FetchSizeAction = importLazyComponent(() => import('./FetchSizeAction.js').then(module => module.FetchSizeAction));

@injectable()
export class TableFetchSizeActionBootstrap extends Bootstrap {
  constructor(private readonly menuService: MenuService) {
    super();
  }

  override register() {
    this.registerGeneralActions();
  }

  private registerGeneralActions() {
    this.menuService.addCreator({
      menus: [DATA_VIEWER_DATA_MODEL_ACTIONS_MENU],
      contexts: [DATA_CONTEXT_DV_DDM],
      isApplicable(context) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX);

        return resultIndex !== undefined && !model.isDisabled(resultIndex);
      },
      getItems(context, items) {
        return [
          new MenuCustomItem({
            id: 'fetch-size',
            getComponent: () => FetchSizeAction,
          }),
          ...items,
        ];
      },
      // orderItems(context, items) {
      //   const extracted = menuExtractItems(items, [MENU_DATA_VIEWER_AUTO_REFRESH]);
      //   return [...extracted, ...items];
      // },
    });
  }
}
