/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, observable, runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';

import { useAutoLoad, useExecutor } from '@cloudbeaver/core-blocks';
import { type TabContainerPanelComponent, useTab } from '@cloudbeaver/core-ui';
import { uuid } from '@cloudbeaver/core-utils';

import { ConnectionSectionWrapper } from '../ConnectionSectionWrapper.js';
import { getConnectionFormDriverPropertiesPart } from './getConnectionFormDriverPropertiesPart.js';
import type { IConnectionFormProps } from '../IConnectionFormState.js';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';
import { DriverPropertiesTable } from './DriverPropertiesTable/DriverPropertiesTable.js';
import type { IDriverProperty } from './DriverPropertiesTable/IDriverProperty.js';
import { useDriverProperties } from './useDriverProperties.js';

export const DriverProperties: TabContainerPanelComponent<IConnectionFormProps> = observer(function DriverProperties({ tabId, formState }) {
  const { selected } = useTab(tabId);
  const driverPropertiesPart = getConnectionFormDriverPropertiesPart(formState);
  const optionsPart = getConnectionFormOptionsPart(formState);

  const [state] = useState(() => {
    const propertiesList: IDriverProperty[] = observable([]);

    function add(key?: string, value?: string) {
      const id = uuid();
      propertiesList.unshift({
        id,
        key: key ?? '',
        defaultValue: value ?? '',
        keyPlaceholder: 'property',
        new: key === undefined,
        custom: true,
      });
      return id;
    }

    function remove(property: IDriverProperty) {
      propertiesList.splice(propertiesList.indexOf(property), 1);
    }

    function reset() {
      propertiesList.splice(0, propertiesList.length);
    }

    return { propertiesList, add, remove, reset };
  });

  useExecutor({
    executor: optionsPart.onDriverIdChange,
    handlers: [
      function handleDriverChange() {
        state.reset();
      },
    ],
  });

  const propertiesState = useDriverProperties({ formState, config: optionsPart.state, selected });

  runInAction(() => {
    if (propertiesState.properties) {
      for (const key of Object.keys(driverPropertiesPart.state)) {
        if (propertiesState.properties.some(property => property.id === key) || state.propertiesList.some(property => property.key === key)) {
          continue;
        }

        state.add(key, driverPropertiesPart.state[key]);
      }
    }
  });

  const joinedProperties = useMemo(
    () =>
      computed<IDriverProperty[]>(() => [
        ...state.propertiesList,
        ...(propertiesState.properties
          ? propertiesState.properties.map<IDriverProperty>(property => ({
              id: property.id!,
              key: property.id!,
              keyPlaceholder: property.id,
              displayName: property.displayName,
              valuePlaceholder: property.defaultValue,
              defaultValue: property.defaultValue,
              description: property.description,
              validValues: property.validValues,
              custom: false,
            }))
          : []),
      ]),
    [propertiesState.properties, state.propertiesList],
  );

  useAutoLoad(DriverProperties, driverPropertiesPart, selected);
  useAutoLoad(DriverProperties, propertiesState, selected, undefined, true);

  return (
    <div className="tw:flex tw:min-h-0 tw:flex-1 tw:overflow-hidden">
      <ConnectionSectionWrapper className="tw:max-w-3xl! tw:min-h-0 tw:flex-1">
        <DriverPropertiesTable
          properties={joinedProperties.get()}
          propertiesState={driverPropertiesPart.state}
          readOnly={formState.isDisabled || formState.isReadOnly}
          onAdd={state.add}
          onRemove={state.remove}
        />
      </ConnectionSectionWrapper>
    </div>
  );
});
