/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { ColoredContainer, Loader, TextPlaceholder, useObjectPropertyCategories, GroupTitle, ObjectPropertyInfoForm, Group, useResource, BASE_CONTAINERS_STYLES, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NavTreeResource, DBObjectResource } from '@cloudbeaver/core-navigation-tree';
import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

const loaderStyles = css`
  ExceptionMessage {
    padding: 24px;
  }
`;

interface Props {
  objectId: string;
  parents: string[];
}

const emptyArray: ObjectPropertyInfo[] = [];

export const ObjectProperties = observer<Props>(function ObjectProperties({
  objectId,
  parents,
}) {
  const translate = useTranslate();
  const navTreeResource = useService(NavTreeResource);
  const dbObject = useResource(ObjectProperties, DBObjectResource, objectId, {
    onLoad: async () => !(await navTreeResource.preloadNodeParents(parents, objectId)),
  });
  const { categories, isUncategorizedExists } = useObjectPropertyCategories(
    dbObject.data?.object?.properties ?? emptyArray
  );
  const properties = dbObject.data?.object?.properties;

  return styled(BASE_CONTAINERS_STYLES)(
    <Loader state={dbObject} style={loaderStyles}>{() => styled(BASE_CONTAINERS_STYLES)(
      <>
        {!properties || properties.length === 0 ? (
          <TextPlaceholder>{translate('plugin_object_viewer_table_no_items')}</TextPlaceholder>
        ) : (
          <ColoredContainer overflow parent gap>
            {isUncategorizedExists && (
              <Group gap large>
                <ObjectPropertyInfoForm
                  properties={properties}
                  category={null}
                  small
                  readOnly
                />
              </Group>
            )}
            {categories.map(category => (
              <Group key={category} gap large>
                <GroupTitle>{category}</GroupTitle>
                <ObjectPropertyInfoForm
                  properties={properties}
                  category={category}
                  small
                  readOnly
                />
              </Group>
            ))}
          </ColoredContainer>
        )}
      </>
    )}
    </Loader>
  );
});
