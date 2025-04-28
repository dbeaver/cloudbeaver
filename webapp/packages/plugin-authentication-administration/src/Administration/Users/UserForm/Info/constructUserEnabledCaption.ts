/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { AdminUserInfoFragment } from '@cloudbeaver/core-sdk';
import { isNotNullDefined } from '@dbeaver/js-helpers';

export function constructUserEnabledCaption(user: AdminUserInfoFragment | undefined): string {
  if (!isNotNullDefined(user) || user.enabled) {
    return '';
  }

  let caption = '';

  if (user.disableReason) {
    caption += user.disableReason;
  }

  if (user.disabledBy) {
    caption += ` (${user.disabledBy})`;
  }

  if (user.disableDate) {
    caption += `, ${new Date(user.disableDate).toLocaleDateString()}`;
  }

  return caption;
}
