/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { PasswordPolicyService } from '@cloudbeaver/core-authentication';
import { useService } from '@cloudbeaver/core-di';
import { PasswordPolicyResource } from '@cloudbeaver/core-root';

import { useFormCustomInputValidation } from './FormControls/useFormCustomInputValidation.js';
import { useResource } from './ResourcesHooks/useResource.js';
import type { IFormContext } from './FormControls/FormContext.js';

export function usePasswordValidation(formContext?: IFormContext) {
  useResource(usePasswordValidation, PasswordPolicyResource, undefined);
  const passwordPolicyService = useService(PasswordPolicyService);

  const { ref } = useFormCustomInputValidation<string>(value => {
    if (!value) {
      return null;
    }

    const validation = passwordPolicyService.validatePassword(value);
    return validation.isValid ? null : validation.errorMessage;
  }, formContext);

  return ref;
}
