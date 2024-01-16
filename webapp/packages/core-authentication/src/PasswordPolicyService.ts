/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import type { PasswordPolicyConfig } from '@cloudbeaver/core-sdk';

const DEFAULT_PASSWORD_POLICY: PasswordPolicyConfig = {
  minLength: 8,
  requiresUpperLowerCase: false,
  minDigits: 0,
  minSpecialCharacters: 0,
};

type ValidationResult = { isValid: true; errorMessage: null } | { isValid: false; errorMessage: string };

@injectable()
export class PasswordPolicyService {
  get config(): PasswordPolicyConfig {
    return {
      minLength: this.serverConfigResource.data?.passwordPolicyConfiguration?.minLength || DEFAULT_PASSWORD_POLICY.minLength,
      requiresUpperLowerCase:
        this.serverConfigResource.data?.passwordPolicyConfiguration?.requiresUpperLowerCase || DEFAULT_PASSWORD_POLICY.requiresUpperLowerCase,
      minDigits: this.serverConfigResource.data?.passwordPolicyConfiguration?.minDigits || DEFAULT_PASSWORD_POLICY.minDigits,
      minSpecialCharacters:
        this.serverConfigResource.data?.passwordPolicyConfiguration?.minSpecialCharacters || DEFAULT_PASSWORD_POLICY.minSpecialCharacters,
    };
  }

  constructor(private readonly serverConfigResource: ServerConfigResource, private readonly localizationService: LocalizationService) {
    makeObservable(this, {
      config: computed,
    });
  }

  validatePassword(password: string): ValidationResult {
    if (password.length < this.config.minLength) {
      return {
        isValid: false,
        errorMessage: this.localizationService.translate('core_authentication_password_policy_min_length', undefined, { min: this.config.minLength }),
      };
    }

    if (this.config.requiresUpperLowerCase && !(/[a-z]/.test(password) && /[A-Z]/.test(password))) {
      return { isValid: false, errorMessage: this.localizationService.translate('core_authentication_password_policy_upper_lower_case') };
    }

    if ((password.match(/\d/g) || []).length < this.config.minDigits) {
      return {
        isValid: false,
        errorMessage: this.localizationService.translate('core_authentication_password_policy_min_digits', undefined, { min: this.config.minDigits }),
      };
    }

    if ((password.match(/[!@#$%^&*(),.?":{}|<>]/g) || []).length < this.config.minSpecialCharacters) {
      return {
        isValid: false,
        errorMessage: this.localizationService.translate('core_authentication_password_policy_min_special_characters', undefined, {
          min: this.config.minSpecialCharacters,
        }),
      };
    }

    return { isValid: true, errorMessage: null };
  }
}
