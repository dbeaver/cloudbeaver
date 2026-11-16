/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { AutoRunningTask, type ITask } from '@cloudbeaver/core-executor';
import { AsyncTaskInfoService } from '@cloudbeaver/core-root';
import type { AiDeviceAuthorizationInfo } from '@cloudbeaver/core-sdk';

import { AIProfilesResource } from '../AIProfilesResource.js';

export class AIProfileAuthorizationServiceImpl {
  constructor(
    private readonly aiProfilesResource: AIProfilesResource,
    private readonly asyncTaskInfoService: AsyncTaskInfoService,
  ) {}

  authorize(profileId: string, onAuthorization: (info: AiDeviceAuthorizationInfo) => void): ITask<boolean> {
    const task = this.asyncTaskInfoService.create(async () => {
      const info = await this.aiProfilesResource.startDeviceAuthorization(profileId);

      if (!task.cancelled) {
        onAuthorization(info);
      }

      return info.taskInfo;
    });

    const operation = new AutoRunningTask(
      async () => {
        try {
          const result = await this.asyncTaskInfoService.run(task);

          if (task.cancelled || result.taskResult !== true) {
            return false;
          }

          this.aiProfilesResource.markOutdated(profileId);

          return true;
        } finally {
          if (!task.pending) {
            await this.asyncTaskInfoService.remove(task.id);
          }
        }
      },
      async () => {
        try {
          if (task.pending && !task.cancelled) {
            await this.asyncTaskInfoService.cancel(task.id);
          }
        } catch (exception) {
          // Task.cancel marks itself cancelled before calling the server; allow a retry on failure.
          operation.cancelled = false;
          throw exception;
        }
      },
    );

    return operation;
  }
}

export type AIProfileAuthorizationService = AIProfileAuthorizationServiceImpl;

export class AIProfileAuthorizationServiceDI extends Context.Service<AIProfileAuthorizationServiceDI, AIProfileAuthorizationServiceImpl>()(
  '@cloudbeaver/plugin-ai-profiles/AIProfileCredentials/AIProfileAuthorizationService#AIProfileAuthorizationService',
) {
  static readonly implementation = AIProfileAuthorizationServiceImpl;

  static readonly dependencies = () => [AIProfilesResource, AsyncTaskInfoService] as const;
  static readonly make: Effect.Effect<
    AIProfileAuthorizationServiceImpl,
    never,
    Context.Service.Identifier<typeof AIProfilesResource> | Context.Service.Identifier<typeof AsyncTaskInfoService>
  > = Effect.gen(function* makeAIProfileAuthorizationService() {
    const aiProfilesResource = yield* AIProfilesResource;
    const asyncTaskInfoService = yield* AsyncTaskInfoService;

    return new AIProfileAuthorizationServiceImpl(aiProfilesResource, asyncTaskInfoService);
  });
  static readonly layer: Layer.Layer<
    AIProfileAuthorizationServiceDI,
    never,
    Context.Service.Identifier<typeof AIProfilesResource> | Context.Service.Identifier<typeof AsyncTaskInfoService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AIProfileAuthorizationService = AIProfileAuthorizationServiceDI;
