/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, observable } from 'mobx';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { type IVersion, VersionResource, VersionService } from '@cloudbeaver/core-version';

interface IInstructionProps {
  version: IVersion;
  link: string | null;
  containerId?: string;
  className?: string;
}

export type InstructionComponent = React.FunctionComponent<IInstructionProps>;

export class VersionUpdateServiceImpl {
  generalInstructionsGetter: (() => React.FC) | null = null;
  versionInstructionGetter: (() => InstructionComponent) | null;
  instructionLink: string | null;

  get newVersionAvailable() {
    if (!this.versionService.current || !this.versionResource.latest) {
      return false;
    }

    return this.versionService.compareVersions(this.versionResource.latest.number, this.versionService.current) === 1;
  }

  constructor(
    private readonly versionService: VersionService,
    private readonly versionResource: VersionResource,
  ) {
    this.versionInstructionGetter = null;
    this.instructionLink = null;

    makeObservable(this, {
      newVersionAvailable: computed,
      instructionLink: observable.ref,
    });
  }

  registerInstructionLink(link: string): void {
    this.instructionLink = link;
  }

  registerVersionInstruction(componentGetter: () => InstructionComponent): void {
    this.versionInstructionGetter = componentGetter;
  }

  registerGeneralInstruction(componentGetter: (() => React.FC) | null): void {
    this.generalInstructionsGetter = componentGetter;
  }
}

export type VersionUpdateService = VersionUpdateServiceImpl;

export class VersionUpdateServiceDI extends Context.Service<VersionUpdateServiceDI, VersionUpdateServiceImpl>()(
  '@cloudbeaver/core-version-update/VersionUpdateService#VersionUpdateService',
) {
  static readonly implementation = VersionUpdateServiceImpl;

  static readonly dependencies = () => [VersionService, VersionResource] as const;
  static readonly make: Effect.Effect<
    VersionUpdateServiceImpl,
    never,
    Context.Service.Identifier<typeof VersionService> | Context.Service.Identifier<typeof VersionResource>
  > = Effect.gen(function* makeVersionUpdateService() {
    const versionService = yield* VersionService;
    const versionResource = yield* VersionResource;

    return new VersionUpdateServiceImpl(versionService, versionResource);
  });
  static readonly layer: Layer.Layer<
    VersionUpdateServiceDI,
    never,
    Context.Service.Identifier<typeof VersionService> | Context.Service.Identifier<typeof VersionResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const VersionUpdateService = VersionUpdateServiceDI;
