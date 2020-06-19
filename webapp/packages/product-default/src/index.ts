/* eslint-disable import-helpers/order-imports, import/order, import/no-duplicates */
/* this eslint-disable required for webpack inject */
import 'reflect-metadata';

import core, { bootstrap } from '@cloudbeaver/core-bootstrap';
import administration from '@cloudbeaver/plugin-administration';
import agGrid from '@cloudbeaver/plugin-ag-grid';
import authentication from '@cloudbeaver/plugin-authentication';
import dataExport from '@cloudbeaver/plugin-data-export';
import dataViewer from '@cloudbeaver/plugin-data-viewer';
import ddlViewer from '@cloudbeaver/plugin-ddl-viewer';
import objectViewer from '@cloudbeaver/plugin-object-viewer';
import sqlEditor from '@cloudbeaver/plugin-sql-editor';
import connectionCustom from '@cloudbeaver/plugin-connection-custom';
import connectionPreconfigured from '@cloudbeaver/plugin-connection-preconfigured';

const PLUGINS = [
  core,
  administration,
  agGrid,
  authentication,
  connectionCustom,
  connectionPreconfigured,
  dataExport,
  dataViewer,
  ddlViewer,
  objectViewer,
  sqlEditor,
];

bootstrap(PLUGINS);
