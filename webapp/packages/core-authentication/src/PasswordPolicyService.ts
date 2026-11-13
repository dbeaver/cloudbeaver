/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { PasswordPolicyResource } from '@cloudbeaver/core-root';
import type { PasswordPolicyConfig } from '@cloudbeaver/core-sdk';

const DEFAULT_PASSWORD_POLICY: PasswordPolicyConfig = {
  minLength: 8,
  minNumberCount: 0,
  minSymbolCount: 0,
  requireMixedCase: false,
};

type ValidationResult = { isValid: true; errorMessage: null } | { isValid: false; errorMessage: string };

export class PasswordPolicyServiceImpl {
  get config(): PasswordPolicyConfig {
    return {
      minLength: this.passwordPolicyResource.data?.minLength || DEFAULT_PASSWORD_POLICY.minLength,
      minNumberCount: this.passwordPolicyResource.data?.minNumberCount || DEFAULT_PASSWORD_POLICY.minNumberCount,
      minSymbolCount: this.passwordPolicyResource.data?.minSymbolCount || DEFAULT_PASSWORD_POLICY.minSymbolCount,
      requireMixedCase: this.passwordPolicyResource.data?.requireMixedCase || DEFAULT_PASSWORD_POLICY.requireMixedCase,
    };
  }

  constructor(
    private readonly passwordPolicyResource: PasswordPolicyResource,
    private readonly localizationService: LocalizationService,
  ) {
    makeObservable(this, {
      config: computed,
    });
  }

  /**
   * PasswordPolicyResource should be loaded before calling this method
   */
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

export type PasswordPolicyService = PasswordPolicyServiceImpl;

export class PasswordPolicyServiceDI extends Context.Service<PasswordPolicyServiceDI, PasswordPolicyServiceImpl>()(
  '@cloudbeaver/core-authentication/PasswordPolicyService#PasswordPolicyService',
) {
  static readonly implementation = PasswordPolicyServiceImpl;

  static readonly dependencies = () => [PasswordPolicyResource, LocalizationService] as const;
  static readonly make: Effect.Effect<
    PasswordPolicyServiceImpl,
    never,
    Context.Service.Identifier<typeof PasswordPolicyResource> | Context.Service.Identifier<typeof LocalizationService>
  > = Effect.gen(function* makePasswordPolicyService() {
    const passwordPolicyResource = yield* PasswordPolicyResource;
    const localizationService = yield* LocalizationService;

    return new PasswordPolicyServiceImpl(passwordPolicyResource, localizationService);
  });
  static readonly layer: Layer.Layer<
    PasswordPolicyServiceDI,
    never,
    Context.Service.Identifier<typeof PasswordPolicyResource> | Context.Service.Identifier<typeof LocalizationService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const PasswordPolicyService = PasswordPolicyServiceDI;
