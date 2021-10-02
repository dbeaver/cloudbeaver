/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { DBObjectResource, NavNodeInfoResource, NavTreeResource } from '@cloudbeaver/core-app';
import { ColoredContainer, Loader, TextPlaceholder, useObjectPropertyCategories, GroupTitle, ObjectPropertyInfoFormNew, Group, useMapResource } from '@cloudbeaver/core-blocks';
import { BASE_CONTAINERS_STYLES } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { preloadNodeParents } from '../../../preloadNodeParents';

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
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const navTreeResource = useService(NavTreeResource);
  const dbObject = useMapResource(ObjectProperties, DBObjectResource, objectId, {
    onLoad: async () => !(await preloadNodeParents(navTreeResource, navNodeInfoResource, parents, objectId)),
  });
  const styles = useStyles(BASE_CONTAINERS_STYLES);
  const { categories, isUncategorizedExists } = useObjectPropertyCategories(
    dbObject.data?.object?.properties ?? emptyArray
  );
  const properties = dbObject.data?.object?.properties;

  return styled(styles)(
    <Loader state={dbObject}>{() => styled(styles)(
      <>
        {!properties || properties.length === 0 ? (
          <TextPlaceholder>{translate('plugin_object_viewer_table_no_items')}</TextPlaceholder>
        ) : (
          <ColoredContainer overflow parent gap>
            {isUncategorizedExists && (
              <Group gap large>
                <ObjectPropertyInfoFormNew
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
                <ObjectPropertyInfoFormNew
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
