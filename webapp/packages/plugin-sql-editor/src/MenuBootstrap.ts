/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { WindowEventsService } from '@cloudbeaver/core-root';
import { download, getTextFileReadingProcess, throttle, withTimestamp } from '@cloudbeaver/core-utils';
import {
  ACTION_DOWNLOAD,
  ACTION_REDO,
  ACTION_SAVE,
  ACTION_UNDO,
  ACTION_UPLOAD,
  ActionService,
  type IAction,
  KEY_BINDING_REDO,
  KEY_BINDING_SAVE,
  KEY_BINDING_UNDO,
  KeyBindingService,
  menuExtractItems,
  MenuService,
} from '@cloudbeaver/core-view';
import { ConnectionInfoResource, createConnectionParam, type Connection } from '@cloudbeaver/core-connections';
import { promptForFiles } from '@cloudbeaver/core-browser';
import { NotificationService } from '@cloudbeaver/core-events';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { importLazyComponent } from '@cloudbeaver/core-blocks';

import { ACTION_SQL_EDITOR_EXECUTE } from './actions/ACTION_SQL_EDITOR_EXECUTE.js';
import { ACTION_SQL_EDITOR_EXECUTE_NEW } from './actions/ACTION_SQL_EDITOR_EXECUTE_NEW.js';
import { ACTION_SQL_EDITOR_EXECUTE_SCRIPT } from './actions/ACTION_SQL_EDITOR_EXECUTE_SCRIPT.js';
import { ACTION_SQL_EDITOR_FORMAT } from './actions/ACTION_SQL_EDITOR_FORMAT.js';
import { ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN } from './actions/ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN.js';
import { KEY_BINDING_SQL_EDITOR_EXECUTE } from './actions/bindings/KEY_BINDING_SQL_EDITOR_EXECUTE.js';
import { KEY_BINDING_SQL_EDITOR_EXECUTE_NEW } from './actions/bindings/KEY_BINDING_SQL_EDITOR_EXECUTE_NEW.js';
import { KEY_BINDING_SQL_EDITOR_EXECUTE_SCRIPT } from './actions/bindings/KEY_BINDING_SQL_EDITOR_EXECUTE_SCRIPT.js';
import { KEY_BINDING_SQL_EDITOR_FORMAT } from './actions/bindings/KEY_BINDING_SQL_EDITOR_FORMAT.js';
import { KEY_BINDING_SQL_EDITOR_SHOW_EXECUTION_PLAN } from './actions/bindings/KEY_BINDING_SQL_EDITOR_SHOW_EXECUTION_PLAN.js';
import { DATA_CONTEXT_SQL_EDITOR_STATE } from './DATA_CONTEXT_SQL_EDITOR_STATE.js';
import { ESqlDataSourceFeatures } from './SqlDataSource/ESqlDataSourceFeatures.js';
import { SqlDataSourceService } from './SqlDataSource/SqlDataSourceService.js';
import { DATA_CONTEXT_SQL_EDITOR_DATA } from './SqlEditor/DATA_CONTEXT_SQL_EDITOR_DATA.js';
import { SQL_EDITOR_TOOLS_MENU } from './SqlEditor/SQL_EDITOR_TOOLS_MENU.js';
import { SQL_EDITOR_TOOLS_MORE_MENU } from './SqlEditor/SQL_EDITOR_TOOLS_MORE_MENU.js';
import { getSqlEditorName } from './getSqlEditorName.js';
import type { ISqlEditorTabState } from './ISqlEditorTabState.js';
import { SqlEditorSettingsService } from './SqlEditorSettingsService.js';

const SYNC_DELAY = 5 * 60 * 1000;

const ScriptImportDialog = importLazyComponent(() => import('./SqlEditor/ScriptImportDialog.js').then(m => m.ScriptImportDialog));

@injectable()
export class MenuBootstrap extends Bootstrap {
  constructor(
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly keyBindingService: KeyBindingService,
    private readonly sqlDataSourceService: SqlDataSourceService,
    private readonly windowEventsService: WindowEventsService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly sqlEditorSettingsService: SqlEditorSettingsService,
    private readonly notificationService: NotificationService,
    private readonly commonDialogService: CommonDialogService,
  ) {
    super();
  }

  override register(): void {
    this.windowEventsService.onFocusChange.addHandler(throttle(this.focusChangeHandler.bind(this), SYNC_DELAY, false));
    this.actionService.addHandler({
      id: 'sql-editor-base-handler',
      contexts: [DATA_CONTEXT_SQL_EDITOR_STATE],
      actions: [ACTION_SAVE],
      isActionApplicable: (context, action): boolean => {
        const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE)!;

        const dataSource = this.sqlDataSourceService.get(state.editorId);

        if (action === ACTION_SAVE) {
          return dataSource?.isAutoSaveEnabled === false;
        }

        return false;
      },
      handler: async (context, action) => {
        if (action === ACTION_SAVE) {
          const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE)!;
          const source = this.sqlDataSourceService.get(state.editorId);

          if (!source) {
            return;
          }

          await source.save();
        }
      },
      isDisabled: (context, action) => {
        if (action === ACTION_SAVE) {
          const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE)!;
          const source = this.sqlDataSourceService.get(state.editorId);

          if (!source) {
            return true;
          }

          return source.isLoading() || source.isSaved || source.isReadonly();
        }

        return false;
      },
      getActionInfo: (context, action) => {
        if (action === ACTION_SAVE) {
          return {
            ...action.info,
            label: '',
          };
        }

        return action.info;
      },
    });

    this.menuService.addCreator({
      menus: [SQL_EDITOR_TOOLS_MENU],
      contexts: [DATA_CONTEXT_SQL_EDITOR_STATE],
      getItems: (context, items) => [...items, ACTION_SQL_EDITOR_FORMAT, SQL_EDITOR_TOOLS_MORE_MENU],
      orderItems(context, items) {
        const extracted = menuExtractItems(items, [SQL_EDITOR_TOOLS_MORE_MENU]);
        return [...items, ...extracted];
      },
    });
    this.menuService.addCreator({
      menus: [SQL_EDITOR_TOOLS_MENU],
      contexts: [DATA_CONTEXT_SQL_EDITOR_STATE],
      getItems: (context, items) => [...items, ACTION_DOWNLOAD, ACTION_UPLOAD],
    });

    this.actionService.addHandler({
      id: 'sql-editor-actions-more',
      actions: [ACTION_DOWNLOAD, ACTION_UPLOAD],
      contexts: [DATA_CONTEXT_SQL_EDITOR_DATA, DATA_CONTEXT_SQL_EDITOR_STATE],
      isHidden: context => {
        const data = context.get(DATA_CONTEXT_SQL_EDITOR_DATA)!;

        return data.activeSegmentMode.activeSegmentMode;
      },
      isDisabled: (context, action) => {
        const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE)!;

        const dataSource = this.sqlDataSourceService.get(state.editorId);
        switch (action) {
          case ACTION_DOWNLOAD:
            return !dataSource?.script;
          case ACTION_UPLOAD:
            return !!dataSource?.isReadonly();
        }

        return false;
      },
      getActionInfo(context, action) {
        switch (action) {
          case ACTION_DOWNLOAD:
            return {
              ...action.info,
              icon: '/icons/export.svg',
              label: 'sql_editor_download_script_tooltip',
              tooltip: 'sql_editor_download_script_tooltip',
            };

          case ACTION_UPLOAD:
            return {
              ...action.info,
              icon: '/icons/import.svg',
              label: 'sql_editor_upload_script_tooltip',
              tooltip: 'sql_editor_upload_script_tooltip',
            };
        }
        return action.info;
      },
      handler: this.sqlEditorActionHandler.bind(this),
    });
    this.menuService.addCreator({
      menus: [SQL_EDITOR_TOOLS_MENU],
      contexts: [DATA_CONTEXT_SQL_EDITOR_STATE],
      isApplicable: context => {
        const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE)!;

        const dataSource = this.sqlDataSourceService.get(state.editorId);

        return !!dataSource?.hasFeature(ESqlDataSourceFeatures.script);
      },
      getItems: (context, items) => [...items, ACTION_SAVE],
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'sql-editor-save',
      binding: KEY_BINDING_SAVE,
      actions: [ACTION_SAVE],
      contexts: [DATA_CONTEXT_SQL_EDITOR_STATE],
      handler: async context => {
        const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE)!;
        const source = this.sqlDataSourceService.get(state.editorId);

        if (!source) {
          return;
        }

        await source.save();
      },
    });

    this.actionService.addHandler({
      id: 'sql-editor-actions',
      actions: [
        ACTION_SQL_EDITOR_EXECUTE,
        ACTION_SQL_EDITOR_EXECUTE_NEW,
        ACTION_SQL_EDITOR_EXECUTE_SCRIPT,
        ACTION_SQL_EDITOR_FORMAT,
        ACTION_REDO,
        ACTION_UNDO,
        ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN,
      ],
      contexts: [DATA_CONTEXT_SQL_EDITOR_DATA],
      isActionApplicable: (contexts, action): boolean => {
        const sqlEditorData = contexts.get(DATA_CONTEXT_SQL_EDITOR_DATA)!;

        if (sqlEditorData.readonly && [ACTION_REDO, ACTION_UNDO].includes(action)) {
          return false;
        }

        if (
          !sqlEditorData.isExecutionAllowed &&
          [
            ACTION_SQL_EDITOR_EXECUTE,
            ACTION_SQL_EDITOR_EXECUTE_NEW,
            ACTION_SQL_EDITOR_EXECUTE_SCRIPT,
            ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN,
          ].includes(action)
        ) {
          return false;
        }

        if (action === ACTION_SQL_EDITOR_FORMAT) {
          return !!sqlEditorData.dataSource?.hasFeature(ESqlDataSourceFeatures.script) && !sqlEditorData.activeSegmentMode.activeSegmentMode;
        }

        // TODO we have to add check for output action ?
        if (
          !sqlEditorData.dataSource?.hasFeature(ESqlDataSourceFeatures.query) &&
          [ACTION_SQL_EDITOR_EXECUTE, ACTION_SQL_EDITOR_EXECUTE_NEW, ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN].includes(action)
        ) {
          return false;
        }

        return true;
      },
      isDisabled: (context, action) => {
        const data = context.get(DATA_CONTEXT_SQL_EDITOR_DATA)!;
        switch (action) {
          case ACTION_SQL_EDITOR_FORMAT:
            return data.isDisabled || data.isScriptEmpty || data.readonly;
        }

        return false;
      },
      handler: this.sqlEditorActionHandler.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'sql-editor-execute',
      binding: KEY_BINDING_SQL_EDITOR_EXECUTE,
      contexts: [DATA_CONTEXT_SQL_EDITOR_DATA],
      isBindingApplicable: (contexts, action) => action === ACTION_SQL_EDITOR_EXECUTE,
      handler: this.sqlEditorActionHandler.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'sql-editor-execute-new',
      binding: KEY_BINDING_SQL_EDITOR_EXECUTE_NEW,
      contexts: [DATA_CONTEXT_SQL_EDITOR_DATA],
      isBindingApplicable: (contexts, action) => action === ACTION_SQL_EDITOR_EXECUTE_NEW,
      handler: this.sqlEditorActionHandler.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'sql-editor-execute-script',
      binding: KEY_BINDING_SQL_EDITOR_EXECUTE_SCRIPT,
      contexts: [DATA_CONTEXT_SQL_EDITOR_DATA],
      isBindingApplicable: (contexts, action) => {
        const sqlEditorData = contexts.get(DATA_CONTEXT_SQL_EDITOR_DATA);
        return action === ACTION_SQL_EDITOR_EXECUTE_SCRIPT && sqlEditorData?.isExecutionAllowed === true;
      },
      handler: this.sqlEditorActionHandler.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'sql-editor-format',
      binding: KEY_BINDING_SQL_EDITOR_FORMAT,
      contexts: [DATA_CONTEXT_SQL_EDITOR_DATA],
      isBindingApplicable: (contexts, action) => action === ACTION_SQL_EDITOR_FORMAT,
      handler: this.sqlEditorActionHandler.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'sql-editor-redo',
      binding: KEY_BINDING_REDO,
      contexts: [DATA_CONTEXT_SQL_EDITOR_DATA],
      isBindingApplicable: (contexts, action) => action === ACTION_REDO,
      handler: this.sqlEditorActionHandler.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'sql-editor-undo',
      binding: KEY_BINDING_UNDO,
      contexts: [DATA_CONTEXT_SQL_EDITOR_DATA],
      isBindingApplicable: (contexts, action) => action === ACTION_UNDO,
      handler: this.sqlEditorActionHandler.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'sql-editor-show-execution-plan',
      binding: KEY_BINDING_SQL_EDITOR_SHOW_EXECUTION_PLAN,
      contexts: [DATA_CONTEXT_SQL_EDITOR_DATA],
      isBindingApplicable: (contexts, action) => action === ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN,
      handler: this.sqlEditorActionHandler.bind(this),
    });

    // this.menuService.addCreator({
    //   isApplicable: context => (
    //     context.get(DATA_CONTEXT_SQL_EDITOR_DATA) !== undefined
    //     && context.get(DATA_CONTEXT_MENU) === MENU_TAB
    //   ),
    //   getItems: (context, items) => [
    //     KEY_BINDING_SQL_EDITOR_EXECUTE,
    //     ...items,
    //   ],
    // });
  }

  private sqlEditorActionHandler(context: IDataContextProvider, action: IAction): void {
    const data = context.get(DATA_CONTEXT_SQL_EDITOR_DATA)!;

    switch (action) {
      case ACTION_DOWNLOAD:
        {
          const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE)!;
          this.downloadSql(state);
        }
        break;
      case ACTION_UPLOAD:
        {
          const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE)!;
          this.uploadSql(state);
        }
        break;
      case ACTION_SQL_EDITOR_EXECUTE:
        data.executeQuery();
        break;
      case ACTION_SQL_EDITOR_EXECUTE_NEW:
        data.executeQueryNewTab();
        break;
      case ACTION_SQL_EDITOR_EXECUTE_SCRIPT:
        if (data.activeSegmentMode.activeSegmentMode) {
          return;
        }

        data.executeScript();
        break;
      case ACTION_SQL_EDITOR_FORMAT:
        if (data.activeSegmentMode.activeSegmentMode) {
          return;
        }

        data.formatScript();
        break;
      case ACTION_UNDO:
        data.dataSource?.history.undo();
        break;
      case ACTION_REDO:
        data.dataSource?.history.redo();
        break;
      case ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN:
        data.showExecutionPlan();
        break;
    }
  }

  private focusChangeHandler(focused: boolean) {
    if (focused) {
      const dataSources = this.sqlDataSourceService.dataSources.values();

      for (const [_, dataSource] of dataSources) {
        dataSource.markOutdated();
      }
    }
  }

  private downloadSql(state: ISqlEditorTabState) {
    const dataSource = this.sqlDataSourceService.get(state.editorId);

    if (!dataSource) {
      return;
    }

    const executionContext = dataSource?.executionContext;
    let connection: Connection | undefined;

    if (executionContext) {
      connection = this.connectionInfoResource.get(createConnectionParam(executionContext.projectId, executionContext.connectionId));
    }

    const name = getSqlEditorName(state, dataSource, connection);
    const script = dataSource.script;

    const blob = new Blob([script], {
      type: 'application/sql',
    });
    download(blob, `${withTimestamp(name)}.sql`);
  }

  private async uploadSql(state: ISqlEditorTabState) {
    const dataSource = this.sqlDataSourceService.get(state.editorId);

    if (!dataSource) {
      return;
    }
    const files = await promptForFiles({ accept: '.sql,.txt' });
    const file = files[0];

    if (!file) {
      throw new Error('File is not found');
    }

    const maxSize = this.sqlEditorSettingsService.maxFileSize;

    const size = Math.round(file.size / 1024); // kilobyte
    const aboveMaxSize = size > maxSize;

    if (aboveMaxSize) {
      this.notificationService.logInfo({
        title: 'sql_editor_upload_script_max_size_title',
        message: `Max size: ${maxSize}KB\nFile size: ${size}KB`,
        autoClose: false,
      });

      return;
    }

    const prevScript = dataSource.script.trim();
    if (prevScript) {
      const result = await this.commonDialogService.open(ScriptImportDialog, null);

      if (result === DialogueStateResult.Rejected) {
        return;
      }

      if (result !== DialogueStateResult.Resolved && result) {
        this.downloadSql(state);
      }
    }

    try {
      const script = await getTextFileReadingProcess(file).promise;
      dataSource.setScript(script);
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Uploading script error');
    }
  }
}
