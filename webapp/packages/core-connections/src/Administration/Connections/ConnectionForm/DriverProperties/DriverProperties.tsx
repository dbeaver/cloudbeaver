/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useMemo } from 'react';
import styled, { css } from 'reshadow';

import { Loader, PropertiesTable } from '@cloudbeaver/core-blocks';
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
  center {
    margin: auto;
  }
`;

type DriverPropertiesProps = {
  driverId: string;
  state: Record<string, string>;
  loadProperties: boolean;
}

export const DriverProperties = observer(function DriverProperties({
  driverId,
  state,
  loadProperties,
}: DriverPropertiesProps) {
  const controller = useController(DriverPropertiesController, driverId, state);

  useMemo(() => {
    if (loadProperties) {
      controller.loadDriverProperties();
    }
  }, [loadProperties, controller]);

  return styled(useStyles(styles))(
    <properties as="div">
      {controller.isLoading && <Loader />}
      {!controller.isLoading && controller.loaded && (
        <PropertiesTable
          properties={controller.driverProperties}
          propertiesState={state}
          onAdd={controller.addProperty}
        />
      )}
    </properties>
  );
});
