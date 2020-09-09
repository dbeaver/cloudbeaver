/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useEffect } from 'react';
import styled, { css } from 'reshadow';

import { Loader, PropertiesTable } from '@cloudbeaver/core-blocks';
import { DBDriver } from '@cloudbeaver/core-connections';
import { useController } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';

import { DriverPropertiesController } from './DriverPropertiesController';

const styles = css`
  properties {
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: auto;
  }
`;

type DriverPropertyState = {
  [key: string]: string;
}

type DriverPropertiesProps = {
  driver: DBDriver;
  state: DriverPropertyState;
  loadProperties: boolean;
}

export const DriverProperties = observer(function DriverProperties({
  driver,
  state,
  loadProperties,
}: DriverPropertiesProps) {
  const controller = useController(DriverPropertiesController, driver, state);

  useEffect(() => {
    if (loadProperties) {
      controller.loadDriverProperties();
    }
  }, [loadProperties]);

  return styled(useStyles(styles))(
    <properties as="div">
      {controller.isLoading && <Loader />}
      {!controller.isLoading && (
        <PropertiesTable
          properties={controller.driverProperties}
          propertiesState={state}
          onAdd={controller.addProperty}
        />
      )}
    </properties>
  );
});
