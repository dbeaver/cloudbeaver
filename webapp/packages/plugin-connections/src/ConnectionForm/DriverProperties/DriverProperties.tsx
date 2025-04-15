/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, observable, runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';

import { ColoredContainer, Group, type IProperty, PropertiesTable, s, useAutoLoad, useResource, useS } from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import { type TabContainerPanelComponent, useTab } from '@cloudbeaver/core-ui';
import { uuid } from '@cloudbeaver/core-utils';

import styles from './DriverProperties.module.css';
import { getConnectionFormDriverPropertiesPart } from './getConnectionFormDriverPropertiesPart.js';
import type { IConnectionFormProps } from '../IConnectionFormState.js';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';

export const DriverProperties: TabContainerPanelComponent<IConnectionFormProps> = observer(function DriverProperties({ tabId, formState }) {
  const { selected } = useTab(tabId);
  const style = useS(styles);
  const driverPropertiesPart = getConnectionFormDriverPropertiesPart(formState);
  const optionsPart = getConnectionFormOptionsPart(formState);
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

  const driver = useResource(DriverProperties, DBDriverResource, {
    key: (selected && optionsPart.state.driverId) || null,
    includes: ['includeDriverProperties'] as const,
  });

  runInAction(() => {
    if (driver.data) {
      for (const key of Object.keys(driverPropertiesPart.state)) {
        if (driver.data.driverProperties.some(property => property.id === key) || state.propertiesList.some(property => property.key === key)) {
          continue;
        }

        state.add(key, driverPropertiesPart.state[key]);
      }
    }
  });

  const joinedProperties = useMemo(
    () =>
      computed<IProperty[]>(() => [
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
      ]),
    [driver.data],
  );

  useAutoLoad(DriverProperties, driverPropertiesPart, selected);

  return (
    <ColoredContainer className={s(style, { coloredContainer: true })} parent>
      <Group className={s(style, { group: true })} box large>
        <PropertiesTable
          className={s(style, { propertiesTable: true })}
          properties={joinedProperties.get()}
          propertiesState={driverPropertiesPart.state}
          readOnly={formState.isDisabled || formState.isReadOnly}
          filterable
          onAdd={state.add}
          onRemove={state.remove}
        />
      </Group>
    </ColoredContainer>
  );
});
