/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { PasswordPolicyService } from '@cloudbeaver/core-authentication';
import { useService } from '@cloudbeaver/core-di';

import { useCustomInputValidation } from './FormControls/useCustomInputValidation';

export function usePasswordValidation() {
  const passwordPolicyService = useService(PasswordPolicyService);

  const ref = useCustomInputValidation<string>(value => {
    if (!value) {
      return null;
    }

    const validation = passwordPolicyService.validatePassword(value);
    return validation.isValid ? null : validation.errorMessage;
  });

  return ref;
}
