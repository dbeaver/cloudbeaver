/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ILoadableState, ILoadableStateRequest } from '@cloudbeaver/core-utils';

/** Internal execution input. The owner is opaque to the coordinator. */
export interface IMenuLoadRequest {
  readonly scope: object;
  readonly loader: ILoadableState;
  readonly target: ILoadableStateRequest;
}

export function captureMenuLoadRequest(scope: object, loader: ILoadableState): IMenuLoadRequest {
  return { scope, loader, target: loader.captureRequest?.() ?? { state: loader, isCurrent: () => true } };
}

export function isSameMenuLoadRequest(first: IMenuLoadRequest, second: IMenuLoadRequest): boolean {
  return first.scope === second.scope && first.loader === second.loader && first.target.isCurrent() && second.target.isCurrent();
}
