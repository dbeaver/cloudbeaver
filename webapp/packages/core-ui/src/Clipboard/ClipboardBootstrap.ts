/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { ClipboardService } from './ClipboardService.js';

export class ClipboardBootstrapImpl extends Bootstrap {
  constructor(private readonly clipboardService: ClipboardService) {
    super();
  }

  override async load(): Promise<void> {
    await this.clipboardService.tryActivateClipboard();
  }
}

export type ClipboardBootstrap = ClipboardBootstrapImpl;

export class ClipboardBootstrapDI extends Context.Service<ClipboardBootstrapDI, ClipboardBootstrapImpl>()(
  '@cloudbeaver/core-ui/Clipboard/ClipboardBootstrap#ClipboardBootstrap',
) {
  static readonly implementation = ClipboardBootstrapImpl;

  static readonly dependencies = () => [ClipboardService] as const;
  static readonly make: Effect.Effect<ClipboardBootstrapImpl, never, Context.Service.Identifier<typeof ClipboardService>> = Effect.gen(
    function* makeClipboardBootstrap() {
      const clipboardService = yield* ClipboardService;

      return new ClipboardBootstrapImpl(clipboardService);
    },
  );
  static readonly layer: Layer.Layer<ClipboardBootstrapDI, never, Context.Service.Identifier<typeof ClipboardService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ClipboardBootstrap = ClipboardBootstrapDI;
