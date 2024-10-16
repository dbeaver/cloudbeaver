/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';

import { ItemList, ItemListSearch, useResource } from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';

import { TemplateConnectionsResource } from '../../TemplateConnectionsResource.js';
import { TemplateConnectionsService } from '../../TemplateConnectionsService.js';
import { TemplateConnectionItem } from './TemplateConnectionItem.js';

interface Props {
  className?: string;
  onSelect: (dbSourceId: string) => void;
}

export const TemplateConnectionSelector = observer<Props>(function TemplateConnectionSelector({ className, onSelect }) {
  useResource(TemplateConnectionSelector, ProjectInfoResource, CachedMapAllKey, { forceSuspense: true });
  useResource(TemplateConnectionSelector, TemplateConnectionsResource, undefined, { forceSuspense: true });
  const dbDriverResource = useResource(TemplateConnectionSelector, DBDriverResource, CachedMapAllKey);
  const templateConnectionsService = useService(TemplateConnectionsService);

  const templateConnections = templateConnectionsService.projectTemplates;

  const [search, setSearch] = useState('');
  const filteredTemplateConnections = useMemo(() => {
    if (!search) {
      return templateConnections;
    }
    return templateConnections.filter(template => template.name.toUpperCase().includes(search.toUpperCase()));
  }, [search, templateConnections]);

  return (
    <>
      <ItemListSearch onChange={setSearch} />
      <ItemList className={className}>
        {filteredTemplateConnections.map(template => (
          <TemplateConnectionItem
            key={template.id}
            template={template}
            dbDriver={dbDriverResource.resource.get(template.driverId)}
            onSelect={onSelect}
          />
        ))}
      </ItemList>
    </>
  );
});
