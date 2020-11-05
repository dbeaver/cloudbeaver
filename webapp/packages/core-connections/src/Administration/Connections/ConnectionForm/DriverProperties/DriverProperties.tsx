/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { Loader, PropertiesTable, useTab } from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';

import { ConnectionFormController } from '../ConnectionFormController';
import { IConnectionFormModel } from '../IConnectionFormModel';
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

interface DriverPropertiesProps {
  tabId: string;
  model: IConnectionFormModel;
  controller: ConnectionFormController;
}

export const DriverProperties = observer(function DriverProperties({
  tabId,
  model,
  controller: formController,
}: DriverPropertiesProps) {
  const controller = useController(DriverPropertiesController, model.connection.driverId, model.connection.properties);
  const isOriginLocal = formController.local;
  useTab(tabId, controller.loadDriverProperties);

  return styled(useStyles(styles))(
    <properties as="div">
      {controller.isLoading && <Loader />}
      {!controller.isLoading && controller.loaded && (
        <PropertiesTable
          properties={controller.driverProperties}
          propertiesState={model.connection.properties}
          readOnly={!isOriginLocal}
          onAdd={controller.addProperty}
        />
      )}
    </properties>
  );
});
