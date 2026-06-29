/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { GraphQLService, ResultDataFormat, type SqlResultAssociation } from '@cloudbeaver/core-sdk';
import { injectable } from '@cloudbeaver/core-di';

import { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet.js';
import { IDatabaseDataResult } from '../../IDatabaseDataResult.js';
import { DatabaseDataAction } from '../../DatabaseDataAction.js';
import type { IDatabaseReferencesAction } from '../IDatabaseReferencesAction.js';

interface ISqlResultAssociation extends SqlResultAssociation {
  id: string;
}

@injectable(() => [IDatabaseDataSource, IDatabaseDataResult, GraphQLService])
export class ResultSetReferencesAction extends DatabaseDataAction<any, IDatabaseResultSet> implements IDatabaseReferencesAction<IDatabaseResultSet> {
  static dataFormat = [ResultDataFormat.Resultset];

  associations: ISqlResultAssociation[];

  constructor(
    source: IDatabaseDataSource,
    result: IDatabaseDataResult,
    private readonly graphQLService: GraphQLService,
  ) {
    super(source as unknown as IDatabaseDataSource<unknown, IDatabaseResultSet>, result as IDatabaseResultSet);
    this.associations = [];

    makeObservable(this, {
      associations: observable.ref,
    });

    setTimeout(() => {
      this.loadAssociations();
    }, 0);
  }

  override updateResult(result: IDatabaseResultSet, index: number): void {
    super.updateResult(result, index);
    this.loadAssociations();
  }

  async loadAssociations(): Promise<ISqlResultAssociation[]> {
    const result = this.result;

    if (!result.id) {
      throw new Error("Result's id must be provided");
    }

    const { associations } = await this.graphQLService.sdk.getSqlResultAssociations({
      resultsId: result.id,
      projectId: result.projectId,
      connectionId: result.connectionId,
      contextId: result.contextId,
    });

    this.associations = associations.map(a => ({ ...a, id: `${a.associationName}_${a.reference}` }));
    return this.associations;
  }
}
