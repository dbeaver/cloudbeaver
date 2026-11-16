/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable, observable } from 'mobx';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { SettingsProviderService, type SettingsProvider } from '@cloudbeaver/core-settings';
import { schema } from '@cloudbeaver/core-utils';

import { AIProfilesResource, type AIProfile } from './AIProfilesResource.js';

const DEFAULT_PROFILE_KEY = 'ai.defaultProfile';
const settingsSchema = schema.object({
  [DEFAULT_PROFILE_KEY]: schema.string().nullable().default(null),
});

export class AIDefaultProfileServiceImpl {
  private readonly settings: SettingsProvider<typeof settingsSchema>;
  private savingPromise: Promise<void> | null = null;

  constructor(
    private readonly aiProfilesResource: AIProfilesResource,
    private readonly userInfoResource: UserInfoResource,
    settingsProviderService: SettingsProviderService,
  ) {
    this.settings = settingsProviderService.createSettings(settingsSchema);
    makeObservable<this, 'savingPromise'>(this, {
      savingPromise: observable.ref,
      saving: computed,
      defaultProfileId: computed,
      defaultProfile: computed,
    });

    this.aiProfilesResource.beforeLoad.addHandler(async () => {
      await this.userInfoResource.load();
    });
  }

  get saving(): boolean {
    return this.savingPromise !== null;
  }

  get defaultProfileId(): string | null {
    return this.settings.getValue(DEFAULT_PROFILE_KEY);
  }

  async setDefaultProfile(profileId: string | null): Promise<void> {
    if (this.savingPromise) {
      return this.savingPromise;
    }

    try {
      this.savingPromise = this.saveProfile(profileId);
      await this.savingPromise;
    } finally {
      this.savingPromise = null;
    }
  }

  get defaultProfile(): AIProfile | undefined {
    const profileId = this.defaultProfileId;
    return (
      this.aiProfilesResource.values.find(profile => profile.id === profileId) ??
      this.aiProfilesResource.values.find(profile => profile.isDefault) ??
      this.aiProfilesResource.values[0]
    );
  }

  async restoreDefaultProfile(): Promise<AIProfile | undefined> {
    await Promise.all([this.userInfoResource.load(), this.aiProfilesResource.load(CachedMapAllKey)]);
    return this.defaultProfile;
  }

  private async saveProfile(profileId: string | null): Promise<void> {
    const previous = this.defaultProfileId;

    if (profileId === null) {
      this.settings.resetValue(DEFAULT_PROFILE_KEY);
    } else {
      this.settings.setValue(DEFAULT_PROFILE_KEY, profileId);
    }

    try {
      await this.settings.save();
    } catch (exception) {
      this.settings.setValue(DEFAULT_PROFILE_KEY, previous);
      throw exception;
    }
  }
}

export type AIDefaultProfileService = AIDefaultProfileServiceImpl;

export class AIDefaultProfileServiceDI extends Context.Service<AIDefaultProfileServiceDI, AIDefaultProfileServiceImpl>()(
  '@cloudbeaver/plugin-ai-profiles/AIDefaultProfileService#AIDefaultProfileService',
) {
  static readonly implementation = AIDefaultProfileServiceImpl;

  static readonly dependencies = () => [AIProfilesResource, UserInfoResource, SettingsProviderService] as const;
  static readonly make: Effect.Effect<
    AIDefaultProfileServiceImpl,
    never,
    | Context.Service.Identifier<typeof AIProfilesResource>
    | Context.Service.Identifier<typeof UserInfoResource>
    | Context.Service.Identifier<typeof SettingsProviderService>
  > = Effect.gen(function* makeAIDefaultProfileService() {
    const aiProfilesResource = yield* AIProfilesResource;
    const userInfoResource = yield* UserInfoResource;
    const settingsProviderService = yield* SettingsProviderService;

    return new AIDefaultProfileServiceImpl(aiProfilesResource, userInfoResource, settingsProviderService);
  });
  static readonly layer: Layer.Layer<
    AIDefaultProfileServiceDI,
    never,
    | Context.Service.Identifier<typeof AIProfilesResource>
    | Context.Service.Identifier<typeof UserInfoResource>
    | Context.Service.Identifier<typeof SettingsProviderService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AIDefaultProfileService = AIDefaultProfileServiceDI;
