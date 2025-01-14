/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { schema } from '@cloudbeaver/core-utils';

export const TRANSACTION_INFO_PARAM_SCHEMA = schema
  .object({
    connectionId: schema.string(),
    projectId: schema.string(),
    contextId: schema.string(),
  })
  .required()
  .strict();

export type ITransactionInfoParam = schema.infer<typeof TRANSACTION_INFO_PARAM_SCHEMA>;

export function createTransactionInfoParam(connectionId: string, projectId: string, contextId: string): ITransactionInfoParam {
  return {
    connectionId,
    projectId,
    contextId,
  };
}
