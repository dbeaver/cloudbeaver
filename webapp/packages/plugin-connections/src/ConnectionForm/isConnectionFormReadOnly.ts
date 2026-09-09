/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IConnectionFormProps } from './IConnectionFormState.js';
import { PROFILE_AUTH_MODEL_ID } from './PROFILE_AUTH_MODEL_ID.js';

export function isConnectionFormReadOnly(
  formState: Pick<IConnectionFormProps['formState'], 'isDisabled' | 'isReadOnly'>,
  authModel: string | undefined,
): boolean {
  return formState.isDisabled || formState.isReadOnly || authModel === PROFILE_AUTH_MODEL_ID;
}
