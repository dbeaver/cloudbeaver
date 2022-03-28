
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import { Group, GroupTitle, BASE_CONTAINERS_STYLES, useMapResource, Combobox, Tags, ITag, Tag } from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import { useTranslate } from '@cloudbeaver/core-localization';
import { CachedMapAllKey, resourceKeyList, ServerConfigInput } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';


interface Props {
  serverConfig: ServerConfigInput;
}

const style = css`
  Tags {
    max-height: 100px;
    overflow: auto;
  }
`;

export const ServerConfigurationDriversForm = observer<Props>(function ServerConfigurationDriversForm({
  serverConfig,
}) {
  const translate = useTranslate();
  const driversResource = useMapResource(ServerConfigurationDriversForm, DBDriverResource, CachedMapAllKey);

  const drivers = driversResource.resource.values.slice().sort(driversResource.resource.compare);

  const tags: ITag[] = driversResource.resource.get(resourceKeyList(serverConfig.disabledDrivers || []))
    .filter(Boolean)
    .map(driver => ({
      id: driver!.id,
      label: driver!.name || driver!.id,
      icon: driver!.icon,
    }));

  const handleSelect = useCallback((value: string) => {
    if (serverConfig.disabledDrivers && !serverConfig.disabledDrivers.includes(value)) {
      serverConfig.disabledDrivers.push(value);
    }
  }, []);

  const handleRemove = useCallback((id: string) => {
    if (!serverConfig.disabledDrivers) {
      return;
    }

    const index = serverConfig.disabledDrivers.indexOf(id);

    if (index !== -1) {
      serverConfig.disabledDrivers.splice(index, 1);
    }
  }, []);

  return styled(useStyles(BASE_CONTAINERS_STYLES, style))(
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
      <Tags>
        {tags.map(tag => (
          <Tag key={tag.id} id={tag.id} label={tag.label} icon={tag.icon} onRemove={handleRemove} />
        ))}
      </Tags>
    </Group>
  );
});
