/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Disposable, injectable, IServiceProvider } from '@cloudbeaver/core-di';
import type { ISqlEditorModel } from './ISqlEditorModel.js';
import { makeObservable, observable } from 'mobx';
import type { ISqlEditorTabState } from '../ISqlEditorTabState.js';
import { SqlEditorModel } from './SqlEditorModel.js';
import type { QueryDataSource } from '../QueryDataSource.js';

@injectable(() => [IServiceProvider])
export class SqlEditorModelService extends Disposable {
  private readonly models: Map<string, ISqlEditorModel<any>>;

  constructor(private readonly serviceProvider: IServiceProvider) {
    super();
    this.models = new Map();

    makeObservable<this, 'models'>(this, {
      models: observable.shallow,
    });
  }

  getOrCreate<TDataSource extends QueryDataSource>(state: ISqlEditorTabState): ISqlEditorModel<TDataSource> {
    let model = this.models.get(state.editorId);
    if (!model) {
      model = this.serviceProvider.getService(SqlEditorModel);

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
