/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { isNumber } from '@dbeaver/js-helpers';

import { ServerResourceQuotasResource } from './ServerResourceQuotasResource.js';

interface IQuotas {
  sqlMaxRunningQueries: number;
  sqlResultSetRowsLimit: number;
  sqlResultSetMemoryLimit: number;
  sqlTextPreviewMaxLength: number;
  sqlBinaryPreviewMaxLength: number;
}

type QuotaKey = keyof IQuotas;

const DEFAULT_QUOTAS: IQuotas = {
  sqlMaxRunningQueries: 100,
  sqlResultSetRowsLimit: 100000,
  sqlResultSetMemoryLimit: 2000000,
  sqlTextPreviewMaxLength: 4096,
  sqlBinaryPreviewMaxLength: 261120,
};

export class QuotasServiceImpl {
  get quotas(): IQuotas {
    return {
      sqlMaxRunningQueries: this.getQuota('sqlMaxRunningQueries'),
      sqlResultSetRowsLimit: this.getQuota('sqlResultSetRowsLimit'),
      sqlResultSetMemoryLimit: this.getQuota('sqlResultSetMemoryLimit'),
      sqlTextPreviewMaxLength: this.getQuota('sqlTextPreviewMaxLength'),
      sqlBinaryPreviewMaxLength: this.getQuota('sqlBinaryPreviewMaxLength'),
    };
  }

  constructor(private readonly serverResourceQuotasResource: ServerResourceQuotasResource) {}

  /**
   * Quotas should be manually loaded from ServerResourceQuotasResource before using this method
   */
  getQuota(key: QuotaKey) {
    const serverQuota = this.serverResourceQuotasResource.data?.[key];

    if (isNumber(serverQuota)) {
      return serverQuota;
    }

    return DEFAULT_QUOTAS[key];
  }
}

export type QuotasService = QuotasServiceImpl;

export class QuotasServiceDI extends Context.Service<QuotasServiceDI, QuotasServiceImpl>()('@cloudbeaver/core-root/QuotasService#QuotasService') {
  static readonly implementation = QuotasServiceImpl;

  static readonly dependencies = () => [ServerResourceQuotasResource] as const;
  static readonly make: Effect.Effect<QuotasServiceImpl, never, Context.Service.Identifier<typeof ServerResourceQuotasResource>> = Effect.gen(
    function* makeQuotasService() {
      const serverResourceQuotasResource = yield* ServerResourceQuotasResource;

      return new QuotasServiceImpl(serverResourceQuotasResource);
    },
  );
  static readonly layer: Layer.Layer<QuotasServiceDI, never, Context.Service.Identifier<typeof ServerResourceQuotasResource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const QuotasService = QuotasServiceDI;
