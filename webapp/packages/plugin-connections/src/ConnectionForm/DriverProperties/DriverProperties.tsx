/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';
import styled, { css } from 'reshadow';

import { TabContainerPanelComponent, useTab } from '@cloudbeaver/core-ui';
import { BASE_CONTAINERS_STYLES, ColoredContainer, Group, IProperty, Loader, PropertiesTable, useMapResource } from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import { useStyles } from '@cloudbeaver/core-theming';
import { uuid } from '@cloudbeaver/core-utils';

import type { IConnectionFormProps } from '../IConnectionFormProps';

const styles = css`
  ColoredContainer {
    flex: 1;
    overflow: auto;
  }
  Group {
    max-height: 100%;
  }
  PropertiesTable {
    padding-top: 8px;
    max-height: 100%;
    box-sizing: border-box;
  }
`;

export const DriverProperties: TabContainerPanelComponent<IConnectionFormProps> = observer(function DriverProperties({
  tabId,
  state: formState,
}) {
  const style = useStyles(styles, BASE_CONTAINERS_STYLES);
  const { selected } = useTab(tabId);

  const [state] = useState(() => {
    const propertiesList: IProperty[] = observable([]);

    function add(key?: string, value?: string) {
      propertiesList.unshift({
        id: uuid(),
        key: key ?? '',
        defaultValue: value ?? '',
        keyPlaceholder: 'property',
        new: key === undefined,
      });
    }

    function remove(property: IProperty) {
      propertiesList.splice(propertiesList.indexOf(property), 1);
    }

    return { propertiesList, add, remove };
  });

  const driver = useMapResource(
    DriverProperties,
    DBDriverResource,
    { key: (selected && formState.config.driverId) || null, includes: ['includeDriverProperties'] },
    {
      isActive: () => selected && !!formState.config.driverId,
      onData: driver => {
        for (const key of Object.keys(formState.config.properties)) {
          if (driver.driverProperties?.some(property => property.id === key)
           || state.propertiesList.some(property => property.key === key)) {
            continue;
          }

          state.add(key, formState.config.properties[key]);
        }
      },
    }
  );

  const joinedProperties = useMemo(() => computed<IProperty[]>(() => ([
    ...state.propertiesList,
    ...(driver.data?.driverProperties
      ? driver.data.driverProperties.map<IProperty>(property => ({
        id: property.id!,
        key: property.id!,
        keyPlaceholder: property.id,
        displayName: property.displayName,
        valuePlaceholder: property.defaultValue,
        defaultValue: property.defaultValue,
        description: property.description,
        validValues: property.validValues,
      }))
      : []),
  ])), [driver.data]);

  return styled(style)(
    <Loader state={driver}>
      {() => styled(style)(
        <ColoredContainer parent>
          <Group box keepSize large>
            <PropertiesTable
              properties={joinedProperties.get()}
              propertiesState={formState.config.properties}
              readOnly={formState.readonly}
              onAdd={state.add}
              onRemove={state.remove}
            />
          </Group>
        </ColoredContainer>
      )}
    </Loader>
  );
});
