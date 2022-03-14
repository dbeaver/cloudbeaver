/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import styled, { css } from 'reshadow';

import { Table, TableHeader, TableColumnHeader, TableBody, TextPlaceholder } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { ObjectPropertyInfo, SqlExecutionPlanNode } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { isVisibleProperty } from '../useExecutionPlanTreeState';
import { PropertiesPanelItemsGroup } from './PropertiesPanelItemsGroup';

const styles = css`
    TableColumnHeader {
      composes: theme-background-surface from global;
      position: sticky;
      top: 0;
      z-index: 1;
    }
  `;

interface Props {
  selectedNode: string;
  nodeList: SqlExecutionPlanNode[];
  className?: string;
}

export const PropertiesPanel = observer<Props>(function PropertiesPanel({ selectedNode, nodeList, className }) {
  const style = useStyles(styles);
  const translate = useTranslate();

  const { general, details } = useMemo(() => computed(() => {
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
  }), [selectedNode, nodeList]).get();

  if (!general.length && !details.length) {
    return <TextPlaceholder>{translate('sql_execution_plan_properties_panel_placeholder')}</TextPlaceholder>;
  }

  const nameColumnTitle = translate('sql_execution_plan_properties_panel_name');
  const valueColumnTitle = translate('sql_execution_plan_properties_panel_value');

  return styled(style)(
    <Table className={className}>
      <TableHeader>
        <TableColumnHeader title={nameColumnTitle}>
          {nameColumnTitle}
        </TableColumnHeader>
        <TableColumnHeader title={valueColumnTitle}>
          {valueColumnTitle}
        </TableColumnHeader>
      </TableHeader>
      <TableBody>
        {general.length && <PropertiesPanelItemsGroup properties={general} name={translate('sql_execution_plan_properties_panel_general')} />}
        {details.length && <PropertiesPanelItemsGroup properties={details} name={translate('sql_execution_plan_properties_panel_details')} />}
      </TableBody>
    </Table>
  );
});
