/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { type IVersion, VersionResource, VersionService } from '@cloudbeaver/core-version';

interface IInstructionProps {
  version: IVersion;
  link: string | null;
  containerId?: string;
  className?: string;
}

export type InstructionComponent = React.FunctionComponent<IInstructionProps>;

@injectable(() => [VersionService, VersionResource])
export class VersionUpdateService {
  generalInstructionsGetter: (() => React.FC) | null = null;
  versionInstructionGetter: (() => InstructionComponent) | null;
  instructionLink: string | null;

  get newVersionAvailable(): boolean {
    if (!this.versionService.current || !this.versionResource.latest) {
      return false;
    }

    return this.versionService.compareVersions(this.versionResource.latest.number, this.versionService.current) === 1;
  }

  get availableVersions(): IVersion[] {
    return this.versionResource.values
      .filter(version => this.versionService.greaterOrEqual(version.number, this.versionService.current))
      .sort((a, b) => this.versionService.compareVersions(b.number, a.number));
  }

  get latestHotfix(): IVersion | undefined {
    return this.availableVersions.find(
      version => this.versionService.isHotfix(version.number) && this.versionService.compareVersions(version.number, this.versionService.current) > 0,
    );
  }

  constructor(
    private readonly versionService: VersionService,
    private readonly versionResource: VersionResource,
  ) {
    this.versionInstructionGetter = null;
    this.instructionLink = null;

    makeObservable(this, {
      newVersionAvailable: computed,
      availableVersions: computed,
      latestHotfix: computed,
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
