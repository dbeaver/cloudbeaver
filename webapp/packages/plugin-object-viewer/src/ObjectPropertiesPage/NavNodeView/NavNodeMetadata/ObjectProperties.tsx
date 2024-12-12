/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  ColoredContainer,
  Group,
  GroupTitle,
  ObjectPropertyInfoForm,
  TextPlaceholder,
  useObjectPropertyCategories,
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { DBObjectResource, NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { resourceKeyList } from '@cloudbeaver/core-resource';
import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

interface Props {
  objectId: string;
}

const emptyArray: ObjectPropertyInfo[] = [];

export const ObjectProperties = observer<Props>(function ObjectProperties({ objectId }) {
  const translate = useTranslate();
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const dbObject = useResource(ObjectProperties, DBObjectResource, objectId, {
    freeze: navNodeInfoResource.isOutdated(resourceKeyList(navNodeInfoResource.getParents(objectId))),
  });
  const { categories, isUncategorizedExists } = useObjectPropertyCategories(dbObject.data?.object?.properties ?? emptyArray);
  const properties = dbObject.data?.object?.properties;

  return (
    <>
      {!properties || properties.length === 0 ? (
        <TextPlaceholder>{translate('plugin_object_viewer_table_no_items')}</TextPlaceholder>
      ) : (
        <ColoredContainer overflow parent gap>
          {isUncategorizedExists && (
            <Group gap large>
              <ObjectPropertyInfoForm properties={properties} category={null} small readOnly />
            </Group>
          )}
          {categories.map(category => (
            <Group key={category} gap large>
              <GroupTitle>{category}</GroupTitle>
              <ObjectPropertyInfoForm properties={properties} category={category} small readOnly />
            </Group>
          ))}
        </ColoredContainer>
      )}
    </>
  );
});
