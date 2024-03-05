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
  minNumberCount: 0,
  minSymbolCount: 0,
  requireMixedCase: false,
};

type ValidationResult = { isValid: true; errorMessage: null } | { isValid: false; errorMessage: string };

@injectable()
export class PasswordPolicyService {
  get config(): PasswordPolicyConfig {
    return {
      minLength: this.serverConfigResource.data?.passwordPolicyConfiguration?.minLength || DEFAULT_PASSWORD_POLICY.minLength,
      minNumberCount: this.serverConfigResource.data?.passwordPolicyConfiguration?.minNumberCount || DEFAULT_PASSWORD_POLICY.minNumberCount,
      minSymbolCount: this.serverConfigResource.data?.passwordPolicyConfiguration?.minSymbolCount || DEFAULT_PASSWORD_POLICY.minSymbolCount,
      requireMixedCase: this.serverConfigResource.data?.passwordPolicyConfiguration?.requireMixedCase || DEFAULT_PASSWORD_POLICY.requireMixedCase,
    };
  }

  constructor(private readonly serverConfigResource: ServerConfigResource, private readonly localizationService: LocalizationService) {
    makeObservable(this, {
      config: computed,
    });
  }

  validatePassword(password: string): ValidationResult {
    const trimmedPassword = password.trim();

    if (trimmedPassword.length < this.config.minLength) {
      return {
        isValid: false,
        errorMessage: this.localizationService.translate('core_authentication_password_policy_min_length', undefined, { min: this.config.minLength }),
      };
    }

    if (this.config.requireMixedCase && !(/\p{Ll}/u.test(trimmedPassword) && /\p{Lu}/u.test(trimmedPassword))) {
      return { isValid: false, errorMessage: this.localizationService.translate('core_authentication_password_policy_upper_lower_case') };
    }

    if ((trimmedPassword.match(/\d/g) || []).length < this.config.minNumberCount) {
      return {
        isValid: false,
        errorMessage: this.localizationService.translate('core_authentication_password_policy_min_digits', undefined, {
          min: this.config.minNumberCount,
        }),
      };
    }

    if ((trimmedPassword.match(/[!@#$%^&*(),.?":{}|<>]/g) || []).length < this.config.minSymbolCount) {
      return {
        isValid: false,
        errorMessage: this.localizationService.translate('core_authentication_password_policy_min_special_characters', undefined, {
          min: this.config.minSymbolCount,
        }),
      };
    }

    return { isValid: true, errorMessage: null };
  }
}
