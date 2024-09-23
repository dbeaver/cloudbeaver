/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';

import { Table, TableBody, TableColumnHeader, TableHeader, TextPlaceholder, useTranslate } from '@cloudbeaver/core-blocks';
import type { ObjectPropertyInfo, SqlExecutionPlanNode } from '@cloudbeaver/core-sdk';

import { isVisibleProperty } from '../useExecutionPlanTreeState.js';
import { PropertiesPanelItemsGroup } from './PropertiesPanelItemsGroup.js';

interface Props {
  selectedNode: string;
  nodeList: SqlExecutionPlanNode[];
  className?: string;
}

export const PropertiesPanel = observer<Props>(function PropertiesPanel({ selectedNode, nodeList, className }) {
  const translate = useTranslate();

  const { general, details } = useMemo(
    () =>
      computed(() => {
        const general: ObjectPropertyInfo[] = [];
        const details: ObjectPropertyInfo[] = [];

        const node = nodeList.find(node => node.id === selectedNode);

        if (!node) {
          return { general, details };
        }

        for (const property of node.properties) {
          if (isVisibleProperty(property)) {
            general.push(property);
          } else {
            details.push(property);
          }
        }

        return { general, details };
      }),
    [selectedNode, nodeList],
  ).get();

  if (!general.length && !details.length) {
    return <TextPlaceholder>{translate('sql_execution_plan_properties_panel_placeholder')}</TextPlaceholder>;
  }

  const nameColumnTitle = translate('sql_execution_plan_properties_panel_name');
  const valueColumnTitle = translate('sql_execution_plan_properties_panel_value');

  return (
    <Table className={className}>
      <TableHeader fixed>
        <TableColumnHeader title={nameColumnTitle}>{nameColumnTitle}</TableColumnHeader>
        <TableColumnHeader title={valueColumnTitle}>{valueColumnTitle}</TableColumnHeader>
      </TableHeader>
      <TableBody>
        {!!general.length && <PropertiesPanelItemsGroup properties={general} name={translate('sql_execution_plan_properties_panel_general')} />}
        {!!details.length && <PropertiesPanelItemsGroup properties={details} name={translate('sql_execution_plan_properties_panel_details')} />}
      </TableBody>
    </Table>
  );
});
