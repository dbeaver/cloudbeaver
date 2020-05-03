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

import { DBDriver } from '@dbeaver/core/app';
import { Loader, PropertiesTable } from '@dbeaver/core/blocks';
import { useController } from '@dbeaver/core/di';
import { useStyles } from '@dbeaver/core/theming';

import { DriverPropertiesController } from './DriverPropertiesController';

const styles = css`
  properties {
    display: flex;
    flex: 1;
    flex-direction: column;
  }
`;

type DriverPropertyState = {
  [key: string]: string;
}

type DriverPropertiesProps = {
  driver: DBDriver;
  state: DriverPropertyState;
  isSelected: boolean;
}

export const DriverProperties = observer(function DriverProperties({
  driver,
  state,
  isSelected,
}: DriverPropertiesProps) {
  const controller = useController(DriverPropertiesController, driver);

  useEffect(() => {
    if (isSelected) {
      controller.loadDriverProperties();
    }
  }, [isSelected]);

  return styled(useStyles(styles))(
    <properties as="div">
      {controller.isLoading && <Loader />}
      {!controller.isLoading && (
        <PropertiesTable
          properties={controller.driverProperties}
          propertiesState={state}
          onAdd={controller.onAddProperty}
        />
      )}
    </properties>
  );
});
