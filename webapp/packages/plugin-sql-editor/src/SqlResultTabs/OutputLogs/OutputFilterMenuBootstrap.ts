import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { MenuCheckboxItem, MenuService } from '@cloudbeaver/core-view';

import { OUTPUT_LOGS_FILTER_MENU } from './OUTPUT_LOGS_FILTER_MENU';
import { OUTPUT_LOGS_PANEL_STATE } from './OUTPUT_LOGS_PANEL_STATE';
import { OUTPUT_LOG_TYPES } from './useOutputLogsPanelState';

@injectable()
export class OutputFilterMenuBootstrap extends Bootstrap {
  constructor(private readonly menuService: MenuService) {
    super();
  }

  register(): void | Promise<void> {
    this.menuService.addCreator({
      menus: [OUTPUT_LOGS_FILTER_MENU],
      isApplicable: context => true,
      getItems: (context, items) => [...items],
    });

    this.menuService.addCreator({
      menus: [OUTPUT_LOGS_FILTER_MENU],
      getItems: context => {
        const state = context.get(OUTPUT_LOGS_PANEL_STATE);
        const items = [];

        for (const logType of OUTPUT_LOG_TYPES) {
          items.push(
            new MenuCheckboxItem(
              {
                id: logType,
                label: logType,
                tooltip: logType,
              },
              {
                onSelect: () => {
                  console.log(context.get(OUTPUT_LOGS_PANEL_STATE));
                  if (state.selectedLogTypes.includes(logType)) {
                    state.setSelectedLogTypes(state.selectedLogTypes.filter(type => type !== logType));
                    return;
                  }
                  state.setSelectedLogTypes([...state.selectedLogTypes, logType]);
                },
              },
              {
                isChecked: () => state.selectedLogTypes.includes(logType),
              },
            ),
          );
        }

        return items;
      },
    });
  }

  async load(): Promise<void> {}
}
