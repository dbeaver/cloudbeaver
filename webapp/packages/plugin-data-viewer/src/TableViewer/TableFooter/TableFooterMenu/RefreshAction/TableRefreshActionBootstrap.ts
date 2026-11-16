/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { type IDataContextProvider } from '@cloudbeaver/core-data-context';
import { Bootstrap, Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { declensionOfNumber } from '@cloudbeaver/core-utils';
import { ACTION_REFRESH, ActionService, MenuBaseItem, menuExtractItems, MenuSeparatorItem, MenuService } from '@cloudbeaver/core-view';

import { type IDatabaseRefreshState } from '../../../../DatabaseDataModel/Actions/General/DatabaseRefreshAction.js';
import { DATA_CONTEXT_DV_DDM } from '../../../../DatabaseDataModel/DataContext/DATA_CONTEXT_DV_DDM.js';
import { DATA_CONTEXT_DV_DDM_RESULT_INDEX } from '../../../../DatabaseDataModel/DataContext/DATA_CONTEXT_DV_DDM_RESULT_INDEX.js';
import { DATA_VIEWER_DATA_MODEL_ACTIONS_MENU } from '../DATA_VIEWER_DATA_MODEL_ACTIONS_MENU.js';
import { getRefreshState } from './getRefreshState.js';
import { MENU_DATA_VIEWER_AUTO_REFRESH } from './MENU_DATA_VIEWER_AUTO_REFRESH.js';

const AutoRefreshSettingsDialog = importLazyComponent(() =>
  import('./AutoRefreshSettingsDialog.js').then(module => module.AutoRefreshSettingsDialog),
);

const AUTO_REFRESH_INTERVALS = [5, 10, 15, 30, 60];

export class TableRefreshActionBootstrapImpl extends Bootstrap {
  constructor(
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly localizationService: LocalizationService,
    private readonly commonDialogService: CommonDialogService,
  ) {
    super();
  }

  override register() {
    this.registerGeneralActions();
  }

  private registerGeneralActions() {
    this.menuService.addCreator({
      menus: [DATA_VIEWER_DATA_MODEL_ACTIONS_MENU],
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      isApplicable(context) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;

        return !model.isDisabled(resultIndex);
      },
      getItems(context, items) {
        return [MENU_DATA_VIEWER_AUTO_REFRESH, ...items];
      },
      orderItems(context, items) {
        const extracted = menuExtractItems(items, [MENU_DATA_VIEWER_AUTO_REFRESH]);
        return [...extracted, ...items];
      },
    });

    this.menuService.addCreator({
      menus: [MENU_DATA_VIEWER_AUTO_REFRESH],
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      isApplicable(context) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;

        return !model.isDisabled(resultIndex);
      },
      getItems: (context, items) => {
        const state = getRefreshState(context);
        items = [...items];

        for (const interval of AUTO_REFRESH_INTERVALS) {
          const label = this.getLabel(interval);
          const tooltip = this.localizationService.translate('data_viewer_action_auto_refresh_interval_tooltip', undefined, { interval: label });
          items.push(
            new MenuBaseItem(
              {
                id: `auto-refresh-${interval}`,
                label,
                tooltip,
                disabled: state?.interval === interval * 1000,
              },
              {
                onSelect: () => {
                  state?.setInterval(interval * 1000);
                },
              },
            ),
          );
        }

        items.push(new MenuSeparatorItem());

        items.push(
          new MenuBaseItem(
            {
              id: 'auto-refresh-custom',
              label: 'ui_custom',
              tooltip: 'data_viewer_action_auto_refresh_menu_configure_tooltip',
            },
            {
              onSelect: this.configureAutoRefresh.bind(this, context),
            },
          ),
        );

        items.push(
          new MenuBaseItem(
            {
              id: 'auto-refresh-stop',
              label: 'ui_processing_stop',
              tooltip: 'data_viewer_action_auto_refresh_menu_stop_tooltip',
              disabled: !state?.isAutoRefresh,
            },
            {
              onSelect: () => {
                state?.setInterval(0);
              },
            },
          ),
        );

        return items;
      },
    });

    this.actionService.addHandler({
      id: 'data-base-handler',
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      menus: [DATA_VIEWER_DATA_MODEL_ACTIONS_MENU, MENU_DATA_VIEWER_AUTO_REFRESH],
      actions: [ACTION_REFRESH],
      isDisabled(context) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;

        return model.isLoading();
      },
      getActionInfo(context, action) {
        if (action === ACTION_REFRESH) {
          const state = getRefreshState(context);
          return {
            ...action.info,
            icon: state?.isAutoRefresh ? '/icons/timer_m.svg#root' : '/icons/refresh_sm.svg',
            label: '',
            tooltip: state?.isAutoRefresh ? 'data_viewer_action_auto_refresh_stop_tooltip' : 'data_viewer_action_refresh_tooltip',
          };
        }

        return action.info;
      },
      handler: context => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const state = getRefreshState(context);

        if (state?.isAutoRefresh) {
          state.setInterval(0);
        } else {
          model.refresh();
        }
      },
    });
  }

  private async configureAutoRefresh(context: IDataContextProvider) {
    const state = getRefreshState(context);

    if (!state) {
      return;
    }

    const stateCopy = observable<IDatabaseRefreshState>({
      interval: state.interval / 1000,
      paused: state.paused,
      stopOnError: state.stopOnError,
    });

    const { status } = await this.commonDialogService.open(AutoRefreshSettingsDialog, { state: stateCopy });

    if (status === DialogueStateResult.Resolved) {
      let interval = stateCopy.interval;

      if (typeof interval === 'string') {
        interval = Number.parseInt(interval);
      }

      if (!Number.isInteger(interval)) {
        interval = 0;
      }

      state.setInterval(interval * 1000);
      state.setStopOnError(stateCopy.stopOnError);
    }
  }

  private getLabel(interval: number) {
    let message = ['ui_second_first_form', 'ui_second_second_form', 'ui_second_third_form'];

    if (interval >= 60) {
      message = ['ui_minute_first_form', 'ui_minute_second_form', 'ui_minute_third_form'];
      interval = Math.round(interval / 60);
    }

    return this.localizationService.translate(declensionOfNumber(interval, message), undefined, { interval });
  }
}

export type TableRefreshActionBootstrap = TableRefreshActionBootstrapImpl;

export class TableRefreshActionBootstrapDI extends Context.Service<TableRefreshActionBootstrapDI, TableRefreshActionBootstrapImpl>()(
  '@cloudbeaver/plugin-data-viewer/TableViewer/TableFooter/TableFooterMenu/RefreshAction/TableRefreshActionBootstrap#TableRefreshActionBootstrap',
) {
  static readonly implementation = TableRefreshActionBootstrapImpl;

  static readonly dependencies = () => [ActionService, MenuService, LocalizationService, CommonDialogService] as const;
  static readonly make: Effect.Effect<
    TableRefreshActionBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof LocalizationService>
    | Context.Service.Identifier<typeof CommonDialogService>
  > = Effect.gen(function* makeTableRefreshActionBootstrap() {
    const actionService = yield* ActionService;
    const menuService = yield* MenuService;
    const localizationService = yield* LocalizationService;
    const commonDialogService = yield* CommonDialogService;

    return new TableRefreshActionBootstrapImpl(actionService, menuService, localizationService, commonDialogService);
  });
  static readonly layer: Layer.Layer<
    TableRefreshActionBootstrapDI,
    never,
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof LocalizationService>
    | Context.Service.Identifier<typeof CommonDialogService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const TableRefreshActionBootstrap = TableRefreshActionBootstrapDI;
