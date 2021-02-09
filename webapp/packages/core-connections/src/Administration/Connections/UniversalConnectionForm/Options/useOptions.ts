/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';

import type { DBDriver } from '../../../../DBDriverResource';
import { isJDBCConnection } from '../../../ConnectionsResource';
import type { IConnectionFormProps } from '../ConnectionFormService';

interface IRefObject {
  prevName: string | null;
  props: IConnectionFormProps;
}

const MAX_HOST_LENGTH = 20;

export function useOptions(props: IConnectionFormProps) {
  const refObject = useObjectRef<IRefObject>({
    prevName: null,
    props,
  }, {
    props,
  });

  const updateNameTemplate = useCallback((driver: DBDriver | undefined) => {
    const {
      prevName,
      props: {
        data: { config, info },
        options,
      },
    } = refObject.current;

    const isAutoFill = config.name === prevName || prevName === null;

    if (options.mode === 'edit' || !isAutoFill) {
      return;
    }

    if (isJDBCConnection(driver, info)) {
      refObject.current.prevName = config.url || '';
      config.name = config.url || '';
      return;
    }

    if (!driver) {
      config.name = 'New connection';
      return;
    }

    let name = driver.name || '';
    if (config.host) {
      name += '@' + config.host.slice(0, MAX_HOST_LENGTH);
      if (config.port && config.port !== driver.defaultPort) {
        name += ':' + config.port;
      }
    }
    refObject.current.prevName = name;
    config.name = name;
  }, []);

  const setDefaults = useCallback((driver: DBDriver | undefined, prevDriver: DBDriver | undefined) => {
    const {
      props: {
        data: { config },
      },
    } = refObject.current;

    if (config.host === prevDriver?.defaultServer) {
      config.host = driver?.defaultServer || 'localhost';
    }

    if (config.port === prevDriver?.defaultPort) {
      config.port = driver?.defaultPort;
    }

    if (config.databaseName === prevDriver?.defaultDatabase) {
      config.databaseName = driver?.defaultDatabase;
    }

    if (config.url === prevDriver?.sampleURL) {
      config.url = driver?.sampleURL;
    }

    updateNameTemplate(driver);

    if (prevDriver) {
      for (const property of Object.keys(config.credentials)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete config.credentials[property];
      }

      config.properties = {};
      config.authModelId = driver?.defaultAuthModel;
    }
  }, [updateNameTemplate]);

  return {
    updateNameTemplate,
    setDefaults,
  };
}
