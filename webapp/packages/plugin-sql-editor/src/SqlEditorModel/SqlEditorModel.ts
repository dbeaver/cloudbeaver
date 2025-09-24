/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Disposable, injectable } from '@cloudbeaver/core-di';
import type { ISqlEditorModel } from './ISqlEditorModel.js';
import { SqlDataSourceService } from '../SqlDataSource/SqlDataSourceService.js';
import type { QueryDataSource } from '../QueryDataSource.js';
import type { ISetScriptData, ISqlDataSource, ISqlEditorCursor } from '../SqlDataSource/ISqlDataSource.js';
import type { ISqlEditorTabState } from '../ISqlEditorTabState.js';
import { SQLParser, type IQueryInfo, type ISQLScriptSegment } from '../SQLParser.js';
import { SyncExecutor } from '@cloudbeaver/core-executor';
import { ESqlDataSourceFeatures } from '../SqlDataSource/ESqlDataSourceFeatures.js';
import { SqlEditorService } from '../SqlEditorService.js';
import { NotificationService } from '@cloudbeaver/core-events';
import { computed, makeObservable, observable, reaction } from 'mobx';
import { debouncePromise, memoizeLast } from '@dbeaver/js-helpers';

const ZERO_CURSOR: ISqlEditorCursor = { anchor: 0, head: 0 };

@injectable(() => [SqlDataSourceService, SqlEditorService, NotificationService])
export class SqlEditorModel<TDataSource extends QueryDataSource> extends Disposable implements ISqlEditorModel<TDataSource> {
  state: ISqlEditorTabState | null;
  get cursor(): ISqlEditorCursor {
    return this.dataSource?.cursor ?? ZERO_CURSOR;
  }
  get cursorSegment(): ISQLScriptSegment | undefined {
    const from = Math.min(this.cursor.anchor, this.cursor.head);
    const to = Math.max(this.cursor.anchor, this.cursor.head);

    return this.parser.getSegment(from, to);
  }
  get dataSource(): ISqlDataSource<TDataSource> | undefined {
    if (this.state) {
      return this.sqlDataSourceService.get(this.state.editorId);
    }

    return undefined;
  }
  readonly parser: SQLParser;

  readonly onUpdate: SyncExecutor;

  private parserFn: (script: string, projectId: string, connectionId: string) => Promise<IQueryInfo[]>;
  private getSqlQueryAtPos: typeof this.sqlEditorService.parseSQLQuery;
  private dataSourceListener;
  private updateParserScriptsDebounced: typeof this.updateParserScripts;

  constructor(
    private readonly sqlDataSourceService: SqlDataSourceService,
    private readonly sqlEditorService: SqlEditorService,
    private readonly notificationService: NotificationService,
  ) {
    super();
    this.state = null;
    this.parser = new SQLParser();
    this.onUpdate = new SyncExecutor();
    this.parserFn = (script, projectId, connectionId) =>
      this.sqlEditorService.parseSQLScript(projectId, connectionId, script).then(({ queries }) => queries);

    this.getSqlQueryAtPos = memoizeLast(this.sqlEditorService.parseSQLQuery.bind(this.sqlEditorService));
    this.syncScriptWithDataSource = this.syncScriptWithDataSource.bind(this);

    this.updateParserScriptsDebounced = debouncePromise(() => this.updateParserScripts(), 2000);

    this.dataSourceListener = reaction(
      () => this.dataSource,
      (dataSource, prev) => {
        prev?.onSetScript.removeHandler(this.syncScriptWithDataSource);
        dataSource?.onSetScript.addHandler(this.syncScriptWithDataSource);
        this.syncScriptWithDataSource({ script: dataSource?.script || '', cursor: dataSource?.cursor });
      },
      { fireImmediately: true },
    );

    makeObservable(this, {
      state: observable.shallow,
      dataSource: computed,
      cursor: computed,
    });
  }

  setState(state: ISqlEditorTabState | null): void {
    this.state = state;
    this.onUpdate.execute();
  }

  async getResolvedSegment(): Promise<ISQLScriptSegment | undefined> {
    const projectId = this.dataSource?.executionContext?.projectId;
    const connectionId = this.dataSource?.executionContext?.connectionId;

    for (let attempts = 0; attempts < 5; attempts++) {
      const currentScript = this.parser.actualScript;

      // TODO: we updating parser scripts
      //       script may be changed this will lead to temporary wrong segments offsets
      await this.updateParserScripts();
      if (currentScript !== this.parser.actualScript) {
        continue;
      }

      if (!projectId || !connectionId || this.cursor.anchor !== this.cursor.head) {
        return this.getQuery();
      }

      const result = await this.getSqlQueryAtPos(projectId, connectionId, currentScript, this.cursor.anchor);

      if (currentScript !== this.parser.actualScript) {
        continue;
      }

      if (result.end === 0 && result.start === 0) {
        return this.cursorSegment;
      }

      return this.parser.getSegment(result.start, result.end);
    }

    return undefined;
  }

  private async updateParserScripts() {
    const projectId = this.dataSource?.executionContext?.projectId;
    const connectionId = this.dataSource?.executionContext?.connectionId;
    const script = this.parser.actualScript;

    if (!projectId || !connectionId || !script || !this.dataSource?.hasFeature(ESqlDataSourceFeatures.script)) {
      this.parser.parse(() => []);
      this.onUpdate.execute();
      return;
    }

    try {
      await this.parser.parse(this.parserFn, projectId, connectionId);
      this.onUpdate.execute();
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Failed to parse SQL script');
      throw exception;
    }
  }

  private getQuery(): ISQLScriptSegment | undefined {
    const query = this.cursorSegment;

    if (!query) {
      return undefined;
    }

    query.query = query.query.trim();

    return query;
  }

  private syncScriptWithDataSource({ script }: ISetScriptData) {
    this.parser.setScript(script);
    this.updateParserScriptsDebounced().catch(() => {});
    this.onUpdate.execute();
  }

  protected override dispose(): Promise<void> | void {
    this.dataSourceListener();
    this.dataSource?.onSetScript.removeHandler(this.syncScriptWithDataSource);
  }
}
