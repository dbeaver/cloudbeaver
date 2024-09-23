/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { runInAction } from 'mobx';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import { type DBDriver, DBDriverResource, isJDBCConnection } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import type { DatabaseAuthModel } from '@cloudbeaver/core-sdk';

import type { IConnectionFormState } from '../IConnectionFormProps.js';
import { getConnectionName } from './getConnectionName.js';
import { getDefaultConfigurationType } from './getDefaultConfigurationType.js';

export function useOptions(state: IConnectionFormState) {
  const dbDriverResource = useService(DBDriverResource);
  const refObject = useObjectRef(
    () => ({
      prevName: null as string | null,
      prevDriverId: null as string | null,
    }),
    {
      state,
    },
  );

  return useObjectRef({
    updateNameTemplate(driver: DBDriver | undefined) {
      runInAction(() => {
        const {
          state: { config, info },
        } = refObject;

        if (isJDBCConnection(driver, info)) {
          refObject.prevName = config.url || '';
          config.name = config.url || '';
          return;
        }

        if (!driver) {
          config.name = 'New connection';
          return;
        }

        const name = getConnectionName(driver.name || '', config.host, config.port, driver.defaultPort);

        refObject.prevName = name;
        config.name = name;
      });
    },
    setDefaults(driver: DBDriver | undefined) {
      runInAction(() => {
        const {
          state: { config, info },
          prevDriverId,
        } = refObject;

        if (info || driver?.id !== config.driverId) {
          return;
        }

        let prevDriver: DBDriver | undefined;

        if (prevDriverId) {
          prevDriver = dbDriverResource.get(prevDriverId);
        }

        refObject.prevDriverId = driver?.id || null;

        if (!config.configurationType || !driver?.configurationTypes.includes(config.configurationType)) {
          state.config.configurationType = getDefaultConfigurationType(driver);
        }

        if ((!prevDriver && config.host === undefined) || config.host === prevDriver?.defaultServer) {
          config.host = driver?.defaultServer || 'localhost';
        }

        if ((!prevDriver && config.port === undefined) || config.port === prevDriver?.defaultPort) {
          config.port = driver?.defaultPort;
        }

        if ((!prevDriver && config.databaseName === undefined) || config.databaseName === prevDriver?.defaultDatabase) {
          config.databaseName = driver?.defaultDatabase;
        }

        if ((!prevDriver && config.url === undefined) || config.url === prevDriver?.sampleURL) {
          config.url = driver?.sampleURL;
        }

        if (this.isNameAutoFill()) {
          this.updateNameTemplate(driver);
        }

        if (driver?.id !== prevDriver?.id) {
          config.credentials = {};
          config.providerProperties = {};
          config.authModelId = driver?.defaultAuthModel;
        }
      });
    },
    setAuthModel(model: DatabaseAuthModel) {
      const {
        state: { config, info },
      } = refObject;

      config.credentials = {};

      if (model.id === info?.authModel) {
        if (info.authProperties) {
          for (const property of info.authProperties) {
            if (!property.features.includes('password')) {
              config.credentials[property.id!] = property.value;
            }
          }
        }
      }

      refObject.state.checkFormState();
    },

    isNameAutoFill() {
      const {
        prevName,
        state: { config, mode },
      } = refObject;

      const isAutoFill = config.name === prevName || prevName === null;

      return isAutoFill && mode === 'create';
    },
  });
}
