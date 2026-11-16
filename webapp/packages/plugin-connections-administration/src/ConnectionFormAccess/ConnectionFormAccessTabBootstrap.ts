/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { isGlobalProject, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { getCachedDataResourceLoaderState, getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';
import { EAdminPermission, PermissionsService, SessionPermissionsResource } from '@cloudbeaver/core-root';
import { ConnectionFormService, getConnectionFormOptionsPart } from '@cloudbeaver/plugin-connections';
import { getConnectionFormAccessPart } from './getConnectionFormAccessPart.js';

const ConnectionAccessTable = importLazyComponent(() => import('./ConnectionAccessTable.js').then(m => m.ConnectionAccessTable));

export class ConnectionFormAccessTabBootstrapImpl extends Bootstrap {
  private readonly key: string;

  constructor(
    private readonly connectionFormService: ConnectionFormService,
    private readonly administrationScreenService: AdministrationScreenService,
    private readonly sessionPermissionsResource: SessionPermissionsResource,
    private readonly permissionsService: PermissionsService,
    private readonly projectInfoResource: ProjectInfoResource,
  ) {
    super();
    this.key = 'access';
  }

  override register(): void {
    this.connectionFormService.parts.add({
      key: this.key,
      name: 'connections_connection_edit_access',
      title: 'connections_connection_edit_access',
      icon: '/icons/plugin_connection_shield_user.svg',
      order: 6,
      stateGetter: context => () => getConnectionFormAccessPart(context.formState),
      getLoader: (_, context) => [
        getCachedMapResourceLoaderState(this.projectInfoResource, () => context?.formState.state.projectId ?? null),
        getCachedDataResourceLoaderState(this.sessionPermissionsResource, () => undefined),
      ],
      isHidden: (_, context) => !context || !this.isAccessTabActive(context.formState.state.projectId),
      isDisabled: (tabId, props) => {
        const optionsPart = props?.formState ? getConnectionFormOptionsPart(props.formState) : null;

        return !optionsPart?.state.driverId || this.administrationScreenService.isConfigurationMode;
      },
      panel: () => ConnectionAccessTable,
    });
  }

  private isAccessTabActive(projectId: string | null): boolean {
    return projectId !== null && isGlobalProject(this.projectInfoResource.get(projectId)) && this.permissionsService.has(EAdminPermission.admin);
  }
}

export type ConnectionFormAccessTabBootstrap = ConnectionFormAccessTabBootstrapImpl;

export class ConnectionFormAccessTabBootstrapDI extends Context.Service<ConnectionFormAccessTabBootstrapDI, ConnectionFormAccessTabBootstrapImpl>()(
  '@cloudbeaver/plugin-connections-administration/ConnectionFormAccess/ConnectionFormAccessTabBootstrap#ConnectionFormAccessTabBootstrap',
) {
  static readonly implementation = ConnectionFormAccessTabBootstrapImpl;

  static readonly dependencies = () =>
    [ConnectionFormService, AdministrationScreenService, SessionPermissionsResource, PermissionsService, ProjectInfoResource] as const;
  static readonly make: Effect.Effect<
    ConnectionFormAccessTabBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof ConnectionFormService>
    | Context.Service.Identifier<typeof AdministrationScreenService>
    | Context.Service.Identifier<typeof SessionPermissionsResource>
    | Context.Service.Identifier<typeof PermissionsService>
    | Context.Service.Identifier<typeof ProjectInfoResource>
  > = Effect.gen(function* makeConnectionFormAccessTabBootstrap() {
    const connectionFormService = yield* ConnectionFormService;
    const administrationScreenService = yield* AdministrationScreenService;
    const sessionPermissionsResource = yield* SessionPermissionsResource;
    const permissionsService = yield* PermissionsService;
    const projectInfoResource = yield* ProjectInfoResource;

    return new ConnectionFormAccessTabBootstrapImpl(
      connectionFormService,
      administrationScreenService,
      sessionPermissionsResource,
      permissionsService,
      projectInfoResource,
    );
  });
  static readonly layer: Layer.Layer<
    ConnectionFormAccessTabBootstrapDI,
    never,
    | Context.Service.Identifier<typeof ConnectionFormService>
    | Context.Service.Identifier<typeof AdministrationScreenService>
    | Context.Service.Identifier<typeof SessionPermissionsResource>
    | Context.Service.Identifier<typeof PermissionsService>
    | Context.Service.Identifier<typeof ProjectInfoResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionFormAccessTabBootstrap = ConnectionFormAccessTabBootstrapDI;
