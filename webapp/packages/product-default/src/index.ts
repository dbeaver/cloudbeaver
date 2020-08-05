/* eslint-disable import-helpers/order-imports, import/order, import/no-duplicates */
/* this eslint-disable required for webpack inject */
import 'reflect-metadata';

import core, { bootstrap } from '@cloudbeaver/core-bootstrap';
import administration from '@cloudbeaver/plugin-administration';
import spreadsheet from '@cloudbeaver/plugin-data-spreadsheet';
import authentication from '@cloudbeaver/plugin-authentication';
import dataExport from '@cloudbeaver/plugin-data-export';
import dataViewer from '@cloudbeaver/plugin-data-viewer';
import ddlViewer from '@cloudbeaver/plugin-ddl-viewer';
import objectViewer from '@cloudbeaver/plugin-object-viewer';
import sqlEditor from '@cloudbeaver/plugin-sql-editor';
import connectionCustom from '@cloudbeaver/plugin-connection-custom';
import connectionTemplate from '@cloudbeaver/plugin-connection-template';
import { defaultProductManifest } from './manifest';

const PLUGINS = [
  core,
  administration,
  spreadsheet,
  authentication,
  connectionCustom,
  connectionTemplate,
  dataExport,
  dataViewer,
  ddlViewer,
  objectViewer,
  sqlEditor,
  defaultProductManifest,
];

bootstrap(PLUGINS);
