/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';

interface IQuotas {
  dataExportFileSizeLimit: number;
  sqlMaxRunningQueries: number;
  sqlResultSetRowsLimit: number;
  sqlResultSetMemoryLimit: number;
  sqlTextPreviewMaxLength: number;
  sqlBinaryPreviewMaxLength: number;
}

type QuotaKey = keyof IQuotas;

const DEFAULT_QUOTAS: IQuotas = {
  dataExportFileSizeLimit: 1.0E7,
  sqlMaxRunningQueries: 100,
  sqlResultSetRowsLimit: 100000,
  sqlResultSetMemoryLimit: 2000000,
  sqlTextPreviewMaxLength: 4096,
  sqlBinaryPreviewMaxLength: 261120,
};

function isNumber(value: any): value is number {
  return typeof value === 'number';
}

@injectable()
export class QuotasService {
  get quotas(): IQuotas {
    return {
      dataExportFileSizeLimit: this.getQuota('dataExportFileSizeLimit'),
      sqlMaxRunningQueries: this.getQuota('sqlMaxRunningQueries'),
      sqlResultSetRowsLimit: this.getQuota('sqlResultSetRowsLimit'),
      sqlResultSetMemoryLimit: this.getQuota('sqlResultSetMemoryLimit'),
      sqlTextPreviewMaxLength: this.getQuota('sqlTextPreviewMaxLength'),
      sqlBinaryPreviewMaxLength: this.getQuota('sqlBinaryPreviewMaxLength'),
    };
  }

  constructor(private readonly serverConfigResource: ServerConfigResource) { }

  getQuota(key: QuotaKey) {
    const serverQuota = this.serverConfigResource.data?.resourceQuotas[key];

    if (isNumber(serverQuota)) {
      return serverQuota;
    }

    return DEFAULT_QUOTAS[key];
  }
}