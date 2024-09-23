/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import { Combobox, Group, GroupTitle, type ITag, s, Tag, Tags, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import { CachedMapAllKey, resourceKeyList } from '@cloudbeaver/core-resource';
import type { ServerConfigInput } from '@cloudbeaver/core-sdk';
import { isDefined } from '@cloudbeaver/core-utils';

import style from './ServerConfigurationDriversForm.module.css';

interface Props {
  serverConfig: ServerConfigInput;
}

export const ServerConfigurationDriversForm = observer<Props>(function ServerConfigurationDriversForm({ serverConfig }) {
  const styles = useS(style);
  const translate = useTranslate();
  const driversResource = useResource(ServerConfigurationDriversForm, DBDriverResource, CachedMapAllKey);

  const drivers = driversResource.data.filter(isDefined).sort(driversResource.resource.compare);

  const tags: ITag[] = driversResource.resource
    .get(resourceKeyList(serverConfig.disabledDrivers || []))
    .filter(Boolean)
    .map(driver => ({
      id: driver!.id,
      label: driver!.name || driver!.id,
      icon: driver!.icon,
    }));

  const handleSelect = useCallback(
    (value: string) => {
      if (serverConfig.disabledDrivers && !serverConfig.disabledDrivers.includes(value)) {
        serverConfig.disabledDrivers.push(value);
      }
    },
    [serverConfig.disabledDrivers],
  );

  const handleRemove = useCallback(
    (id: string) => {
      if (!serverConfig.disabledDrivers) {
        return;
      }

      const index = serverConfig.disabledDrivers.indexOf(id);

      if (index !== -1) {
        serverConfig.disabledDrivers.splice(index, 1);
      }
    },
    [serverConfig.disabledDrivers],
  );

  return (
    <Group maximum gap>
      <GroupTitle>{translate('administration_disabled_drivers_title')}</GroupTitle>
      <Combobox
        keySelector={item => item.id}
        valueSelector={value => value.name || value.id}
        iconSelector={value => value.icon}
        isDisabled={item => serverConfig.disabledDrivers?.includes(item.id) ?? false}
        items={drivers}
        placeholder={translate('administration_disabled_drivers_search_placeholder')}
        searchable
        onSelect={handleSelect}
      />
      <Tags className={s(styles, { wrapper: true })}>
        {tags.map(tag => (
          <Tag key={tag.id} id={tag.id} label={tag.label} icon={tag.icon} onRemove={handleRemove} />
        ))}
      </Tags>
    </Group>
  );
});
