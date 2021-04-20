/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import type { PropsWithChildren } from 'react';
import styled from 'reshadow';

import { useDatabaseObjectInfo } from '@cloudbeaver/core-app';
import { ColoredContainer, Loader, TextPlaceholder, useObjectPropertyCategories, GroupTitle, ObjectPropertyInfoFormNew, Group } from '@cloudbeaver/core-blocks';
import { BASE_CONTAINERS_STYLES } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

type ObjectPropertiesProps = PropsWithChildren<{
  objectId: string;
}>;

const emptyArray: ObjectPropertyInfo[] = [];

export const ObjectProperties = observer(function ObjectProperties({
  objectId,
}: ObjectPropertiesProps) {
  const translate = useTranslate();
  const { dbObject, isLoading } = useDatabaseObjectInfo(objectId);
  const styles = useStyles(BASE_CONTAINERS_STYLES);
  const { categories, isUncategorizedExists } = useObjectPropertyCategories(dbObject?.properties ?? emptyArray);
  const properties = dbObject?.properties;

  if (!properties && isLoading) {
    return <Loader />;
  }

  if (!properties || properties.length === 0) {
    return <TextPlaceholder>{translate('plugin_object_viewer_table_no_items')}</TextPlaceholder>;
  }

  return styled(styles)(
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
  );
});
