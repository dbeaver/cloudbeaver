/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';
import styled, { css } from 'reshadow';

import {
  Table, TableHeader, TableColumnHeader, TableBody,
  TableItem,
  TableColumnValue,
  TextPlaceholder,
} from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { Expand } from './Expand';
import { getPropertyValue } from './getPropertyValue';
import { isVisibleProperty } from './useExecutionPlanTreeState';

const styles = composes(
  css`
    TableColumnHeader {
      composes: theme-background-surface from global;
    }
  `,
  css`
    TableColumnHeader {
      position: sticky;
      top: 0;
      z-index: 1;
    }
    TableColumnValue {
      white-space: pre;
    }
    control {
      display: flex;
      align-items: center;
    }
    expand-container {
      width: 24px;
      height: 24px;
      margin-right: 4px;
      cursor: pointer;
      display: flex;
    }
  `
);

interface Props {
  properties: ObjectPropertyInfo[];
  className?: string;
}

export const PropertiesPanel: React.FC<Props> = observer(function PropertiesPanel({ properties, className }) {
  const style = useStyles(styles);
  const translate = useTranslate();
  const [generalExpanded, setGeneralExpanded] = useState(true);
  const [detailsExpanded, setDetailsExpanded] = useState(true);

  const { general, details } = useMemo(() => computed(() => {
    const general: ObjectPropertyInfo[] = [];
    const details: ObjectPropertyInfo[] = [];

    for (const property of properties) {
      if (isVisibleProperty(property)) {
        general.push(property);
      } else {
        details.push(property);
      }
    }

    return { general, details };
  }), [properties]).get();

  if (!general.length && !details.length) {
    return <TextPlaceholder>{translate('sql_execution_plan_properties_panel_placeholder')}</TextPlaceholder>;
  }

  return styled(style)(
    <Table className={className}>
      <TableHeader>
        <TableColumnHeader>
          {translate('sql_execution_plan_properties_panel_name')}
        </TableColumnHeader>
        <TableColumnHeader>
          {translate('sql_execution_plan_properties_panel_value')}
        </TableColumnHeader>
      </TableHeader>
      <TableBody>
        <TableItem item='general_root' selectDisabled>
          <TableColumnValue>
            <control>
              <expand-container>
                <Expand expanded={generalExpanded} onClick={() => setGeneralExpanded(!generalExpanded)} />
              </expand-container>
              {translate('sql_execution_plan_properties_panel_general')}
            </control>
          </TableColumnValue>
          <TableColumnValue />
        </TableItem>
        {generalExpanded && general.map(property => {
          const name = property.displayName;
          const value = getPropertyValue(property);
          return (
            <TableItem key={property.id} item={property} selectDisabled>
              <TableColumnValue title={name}>
                {'\t\t' + name}
              </TableColumnValue>
              <TableColumnValue title={value}>
                {value}
              </TableColumnValue>
            </TableItem>
          );
        })}
        <TableItem item='details_root' selectDisabled>
          <TableColumnValue>
            <control>
              <expand-container>
                <Expand expanded={detailsExpanded} onClick={() => setDetailsExpanded(!detailsExpanded)} />
              </expand-container>
              {translate('sql_execution_plan_properties_panel_details')}
            </control>
          </TableColumnValue>
          <TableColumnValue />
        </TableItem>
        {detailsExpanded && details.map(property => {
          const name = property.displayName;
          const value = getPropertyValue(property);
          return (
            <TableItem key={property.id} item={property} selectDisabled>
              <TableColumnValue title={name}>
                {'\t\t' + name}
              </TableColumnValue>
              <TableColumnValue title={value}>
                {value}
              </TableColumnValue>
            </TableItem>
          );
        })}
      </TableBody>
    </Table>
  );
});
