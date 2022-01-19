/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable } from 'mobx';
import { compare } from 'semver';

import { injectable } from '@cloudbeaver/core-di';
import { IVersion, VersionResource, VersionService } from '@cloudbeaver/core-version';

interface IInstructionProps {
  version: IVersion;
  hostName?: string;
  className?: string;
}

export type InstructionComponent = React.FunctionComponent<IInstructionProps>;

@injectable()
export class VersionUpdateService {
  instructionGetter: (() => InstructionComponent) | null;

  get newVersionAvailable() {
    if (!this.versionService.current || !this.versionResource.latest) {
      return false;
    }

    return compare(this.versionResource.latest.number, this.versionService.current) === 1;
  }

  constructor(
    private readonly versionService: VersionService,
    private readonly versionResource: VersionResource,
  ) {
    this.instructionGetter = null;

    makeObservable(this, {
      newVersionAvailable: computed,
    });
  }

  registerInstruction(componentGetter: () => InstructionComponent): void {
    this.instructionGetter = componentGetter;
  }
}
