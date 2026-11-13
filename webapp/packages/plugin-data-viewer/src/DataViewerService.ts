/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { reaction } from 'mobx';

import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, EConnectionFeature, type Connection } from '@cloudbeaver/core-connections';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { EAdminPermission, SessionPermissionsResource } from '@cloudbeaver/core-root';

import { DataViewerSettingsService } from './DataViewerSettingsService.js';
import type { IDatabaseDataModel } from './DatabaseDataModel/IDatabaseDataModel.js';
import { DatabaseDataAccessMode } from './DatabaseDataModel/IDatabaseDataSource.js';
import type { ResultSetDataSource } from './ResultSet/ResultSetDataSource.js';

export interface IErrorActionsContainerData {
  model: IDatabaseDataModel<any>;
}

export class DataViewerServiceImpl {
  readonly errorActionsContainer: PlaceholderContainer<IErrorActionsContainerData>;

  get canCopyData() {
    return this.sessionPermissionsResource.has(EAdminPermission.admin) || !this.dataViewerSettingsService.disableCopyData;
  }

  get canExportData() {
    return this.sessionPermissionsResource.has(EAdminPermission.admin) || !this.dataViewerSettingsService.disableExportData;
  }

  constructor(
    private readonly dataViewerSettingsService: DataViewerSettingsService,
    private readonly sessionPermissionsResource: SessionPermissionsResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {
    this.errorActionsContainer = new PlaceholderContainer();
  }

  trackDataAccess<TSource extends ResultSetDataSource>(model: IDatabaseDataModel<TSource>): void {
    const dispose = reaction(
      () => {
        const key = model.source.options?.connectionKey;
        const connection = key && this.connectionInfoResource.get(key);

        return !!connection && this.isDataEditable(connection);
      },
      editable => model.setAccess(editable ? DatabaseDataAccessMode.Default : DatabaseDataAccessMode.Readonly),
      { fireImmediately: true },
    );

    model.onDispose.addHandler(() => dispose());
  }

  isDataEditable(connection: Connection) {
    if (connection.readOnly || connection.features.includes(EConnectionFeature.restrictDataEdit)) {
      return false;
    }

    const isAdmin = this.sessionPermissionsResource.has(EAdminPermission.admin);
    const disabled = this.dataViewerSettingsService.disableEdit;

    return isAdmin || !disabled;
  }
}

export type DataViewerService = DataViewerServiceImpl;

export class DataViewerServiceDI extends Context.Service<DataViewerServiceDI, DataViewerServiceImpl>()(
  '@cloudbeaver/plugin-data-viewer/DataViewerService#DataViewerService',
) {
  static readonly implementation = DataViewerServiceImpl;

  static readonly dependencies = () => [DataViewerSettingsService, SessionPermissionsResource, ConnectionInfoResource] as const;
  static readonly make: Effect.Effect<
    DataViewerServiceImpl,
    never,
    | Context.Service.Identifier<typeof DataViewerSettingsService>
    | Context.Service.Identifier<typeof SessionPermissionsResource>
    | Context.Service.Identifier<typeof ConnectionInfoResource>
  > = Effect.gen(function* makeDataViewerService() {
    const dataViewerSettingsService = yield* DataViewerSettingsService;
    const sessionPermissionsResource = yield* SessionPermissionsResource;
    const connectionInfoResource = yield* ConnectionInfoResource;

    return new DataViewerServiceImpl(dataViewerSettingsService, sessionPermissionsResource, connectionInfoResource);
  });
  static readonly layer: Layer.Layer<
    DataViewerServiceDI,
    never,
    | Context.Service.Identifier<typeof DataViewerSettingsService>
    | Context.Service.Identifier<typeof SessionPermissionsResource>
    | Context.Service.Identifier<typeof ConnectionInfoResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DataViewerService = DataViewerServiceDI;
