/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { ADMINISTRATION_AI_PAGE } from './ADMINISTRATION_AI_PAGE.js';

export enum EAIAdministrationSub {
  Settings = 'settings',
  Profiles = 'profiles',
  ToolsAndMcp = 'tools-and-mcp',
}

export class AIAdministrationNavigationServiceImpl {
  static ItemName = ADMINISTRATION_AI_PAGE;

  constructor(private readonly administrationScreenService: AdministrationScreenService) {}

  navToSub(sub: string): void {
    this.administrationScreenService.navigateToItemSub(AIAdministrationNavigationServiceImpl.ItemName, sub);
  }
}

export type AIAdministrationNavigationService = AIAdministrationNavigationServiceImpl;

export class AIAdministrationNavigationServiceDI extends Context.Service<
  AIAdministrationNavigationServiceDI,
  AIAdministrationNavigationServiceImpl
>()('@cloudbeaver/plugin-ai-administration/AIAdministrationNavigationService#AIAdministrationNavigationService') {
  static readonly implementation = AIAdministrationNavigationServiceImpl;
  static readonly ItemName = AIAdministrationNavigationServiceImpl.ItemName;
  static readonly dependencies = () => [AdministrationScreenService] as const;
  static readonly make: Effect.Effect<AIAdministrationNavigationServiceImpl, never, Context.Service.Identifier<typeof AdministrationScreenService>> =
    Effect.gen(function* makeAIAdministrationNavigationService() {
      const administrationScreenService = yield* AdministrationScreenService;

      return new AIAdministrationNavigationServiceImpl(administrationScreenService);
    });
  static readonly layer: Layer.Layer<AIAdministrationNavigationServiceDI, never, Context.Service.Identifier<typeof AdministrationScreenService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const AIAdministrationNavigationService = AIAdministrationNavigationServiceDI;
