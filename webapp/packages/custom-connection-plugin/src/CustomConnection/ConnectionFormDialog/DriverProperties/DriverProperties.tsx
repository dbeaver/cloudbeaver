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
import { Button, Loader } from '@dbeaver/core/blocks';
import { useController } from '@dbeaver/core/di';
import { useTranslate } from '@dbeaver/core/localization';
import { useStyles, composes } from '@dbeaver/core/theming';

import { DriverPropertiesController, DriverPropertyState } from './DriverPropertiesController';
import { DriverProperty } from './DriverProperty';

const styles = composes(
  css`
    properties-header {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
    properties-header-name, properties-header-value {
      composes: theme-background-surface theme-text-on-surface from global;
    }
  `,
  css`
    properties {
      display: flex;
      flex: 1;
      flex-direction: column;
    }
    properties-header {
      box-sizing: border-box;
      display: inline-flex;
      padding: 5px 1px;
      position: sticky;
      z-index: 1;
      top: 0;
    }
    properties-header-name, properties-header-value {
      composes: theme-typography--caption from global;
      text-transform: uppercase;
      box-sizing: border-box;
      flex: 1;
      padding: 4px 36px;
      margin: 0px 1px;
    }
    properties-header-name {
      flex: 0 0 auto;
      width: 300px;
    }
    properties-header-right {
      flex: 0 0 auto;
      margin: 0px 1px;
    }

    properties-list {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding-bottom: 24px;
    }
  `
);

type DriverPropertiesProps = {
  driver: DBDriver;
  properties: DriverPropertyState;
  isSelected: boolean;
}

export const DriverProperties = observer(function DriverProperties({
  driver,
  properties,
  isSelected,
}: DriverPropertiesProps) {
  const translate = useTranslate();
  const controller = useController(DriverPropertiesController, driver, properties);

  useEffect(() => {
    if (isSelected) {
      controller.loadDriverProperties();
    }
  }, [isSelected]);

  return styled(useStyles(styles))(
    <properties as="div">
      <properties-header as="div">
        <properties-header-name as="div">
          {translate('customConnection_properties_name')}
        </properties-header-name>
        <properties-header-value as="div">
          {translate('customConnection_properties_value')}
        </properties-header-value>
        <properties-header-right as="div">
          <Button type='button' mod={['outlined']} onClick={controller.onAddProperty}>{translate('customConnection_properties_add')}</Button>
        </properties-header-right>
      </properties-header>
      {controller.isLoading && <Loader />}
      {!controller.isLoading && (
        <properties-list as="div">
          {controller.driverProperties.map(property => (
            <DriverProperty
              key={property.staticId}
              property={property}
              value={controller.state[property.id]}
              onNameChange={controller.onNameChange}
              onValueChange={controller.onValueChange}
              onRemove={controller.onRemove}
              error={controller.getPropertyIdCount(property.id) > 1}
            />
          ))}
        </properties-list>
      )}
    </properties>
  );
});
