/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, Disposable, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { makeObservable, observable } from 'mobx';
import type { ISqlEditorTabState } from '../ISqlEditorTabState.js';
import type { QueryDataSource } from '../QueryDataSource.js';
import type { ISqlEditorModel } from './ISqlEditorModel.js';
import { SqlEditorModelFactory } from './SqlEditorModelFactory.js';

export class SqlEditorModelServiceImpl extends Disposable {
  private readonly models: Map<string, ISqlEditorModel<any>>;

  constructor(private readonly modelFactory: Context.Service.Shape<typeof SqlEditorModelFactory>) {
    super();
    this.models = new Map();

    makeObservable<this, 'models'>(this, {
      models: observable.shallow,
    });
  }

  getOrCreate<TDataSource extends QueryDataSource>(state: ISqlEditorTabState): ISqlEditorModel<TDataSource> {
    let model = this.models.get(state.editorId);

    if (!model) {
      model = this.modelFactory.create<TDataSource>();

      model.setState(state);
      this.models.set(state.editorId, model);
    }

    return model;
  }

  async destroy(editorId: string): Promise<void> {
    const model = this.models.get(editorId);

    if (model) {
      await model[Symbol.asyncDispose]?.().catch(e => {
        console.error(e);
      });
    }

    this.models.delete(editorId);
  }

  async destroySilent(editorId: string): Promise<void> {
    await this.destroy(editorId);
  }

  async unload(editorId: string): Promise<void> {
    await this.destroy(editorId);
  }

  protected override async dispose(): Promise<void> {
    for (const model of this.models.values()) {
      await model[Symbol.asyncDispose]?.().catch(e => {
        console.error(e);
      });
    }

    this.models.clear();
  }
}

export type SqlEditorModelService = SqlEditorModelServiceImpl;

export class SqlEditorModelServiceDI extends Context.Service<SqlEditorModelServiceDI, SqlEditorModelServiceImpl>()(
  '@cloudbeaver/plugin-sql-editor/SqlEditorModel/SqlEditorModelService#SqlEditorModelService',
) {
  static readonly implementation = SqlEditorModelServiceImpl;

  static readonly dependencies = () => [SqlEditorModelFactory] as const;
  static readonly make: Effect.Effect<SqlEditorModelServiceImpl, never, SqlEditorModelFactory> = Effect.gen(function* makeSqlEditorModelService() {
    const modelFactory = yield* SqlEditorModelFactory;

    return new SqlEditorModelServiceImpl(modelFactory);
  });
  static readonly layer: Layer.Layer<SqlEditorModelServiceDI, never, SqlEditorModelFactory> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SqlEditorModelService = SqlEditorModelServiceDI;
