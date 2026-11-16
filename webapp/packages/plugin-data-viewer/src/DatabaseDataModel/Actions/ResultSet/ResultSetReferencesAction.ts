/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { GraphQLService, ResultDataFormat, type SqlResultAssociation } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../../DatabaseDataAction.js';
import { IDatabaseDataResult } from '../../IDatabaseDataResult.js';
import { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet.js';
import type { IDatabaseReferencesAction } from '../IDatabaseReferencesAction.js';

export interface ISqlResultAssociation extends SqlResultAssociation {
  id: string;
}

export class ResultSetReferencesActionImpl
  extends DatabaseDataAction<any, IDatabaseResultSet>
  implements IDatabaseReferencesAction<IDatabaseResultSet>
{
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

export type ResultSetReferencesAction = ResultSetReferencesActionImpl;

export class ResultSetReferencesActionDI extends Context.Service<ResultSetReferencesActionDI, ResultSetReferencesActionImpl>()(
  '@cloudbeaver/plugin-data-viewer/DatabaseDataModel/Actions/ResultSet/ResultSetReferencesAction#ResultSetReferencesAction',
) {
  static readonly implementation = ResultSetReferencesActionImpl;
  static readonly dataFormat = ResultSetReferencesActionImpl.dataFormat;
  static readonly dependencies = () => [IDatabaseDataSource, IDatabaseDataResult, GraphQLService] as const;
  static readonly make: Effect.Effect<
    ResultSetReferencesActionImpl,
    never,
    | Context.Service.Identifier<typeof IDatabaseDataSource>
    | Context.Service.Identifier<typeof IDatabaseDataResult>
    | Context.Service.Identifier<typeof GraphQLService>
  > = Effect.gen(function* makeResultSetReferencesAction() {
    const source = yield* IDatabaseDataSource;
    const result = yield* IDatabaseDataResult;
    const graphQLService = yield* GraphQLService;

    return new ResultSetReferencesActionImpl(source, result, graphQLService);
  });
  static readonly layer: Layer.Layer<
    ResultSetReferencesActionDI,
    never,
    | Context.Service.Identifier<typeof IDatabaseDataSource>
    | Context.Service.Identifier<typeof IDatabaseDataResult>
    | Context.Service.Identifier<typeof GraphQLService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ResultSetReferencesAction = ResultSetReferencesActionDI;
