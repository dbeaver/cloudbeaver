/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { DBObject, DBObjectResource, NavTreeResource } from '@cloudbeaver/core-app';
import { Loader, TextPlaceholder, useMapResource } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { resourceKeyList } from '@cloudbeaver/core-sdk';
import { css } from '@reshadow/react';

import { ObjectChildrenPropertyTable } from './ObjectChildrenPropertyTable';

const styles = css`
  div {
    flex: auto;
    overflow: hidden;
  }
  ExceptionMessage {
    padding: 24px;
  }
`;

interface ObjectPropertyTableProps {
  objectId: string;
  parentId: string;
}

export const ObjectPropertyTable = observer<ObjectPropertyTableProps>(function ObjectPropertyTable({
  objectId,
  parentId,
}) {
  const translate = useTranslate();
  const tree = useMapResource(NavTreeResource, objectId);
  const key = resourceKeyList(tree.data || []);
  const dbObject = useMapResource(DBObjectResource, key, {
    async onLoad(resource: DBObjectResource) {
      await resource.loadChildren(objectId, key);
      return true;
    },
  });

  const objects = dbObject.data as DBObject[];

  return styled(styles)(
    <Loader state={[tree, dbObject]} style={styles}>{() => styled(styles)(
      <>
        {!tree.data || tree.data.length === 0 ? (
          <TextPlaceholder>{translate('plugin_object_viewer_table_no_items')}</TextPlaceholder>
        ) : (
          <div>
            <ObjectChildrenPropertyTable objects={objects} />
          </div>
        )}
      </>
    )}
    </Loader>
  );
});
