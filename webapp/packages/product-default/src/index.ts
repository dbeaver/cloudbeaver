import 'reflect-metadata';

import core, { bootstrap } from '@cloudbeaver/core-bootstrap';
import administration from '@cloudbeaver/plugin-administration';
import authentication from '@cloudbeaver/plugin-authentication';
import connectionCustom from '@cloudbeaver/plugin-connection-custom';
import connectionTemplate from '@cloudbeaver/plugin-connection-template';
import connectionPlugin from '@cloudbeaver/plugin-connections';
import dataExport from '@cloudbeaver/plugin-data-export';
import spreadsheetNew from '@cloudbeaver/plugin-data-spreadsheet-new';
import dataViewer from '@cloudbeaver/plugin-data-viewer';
import ddlViewer from '@cloudbeaver/plugin-ddl-viewer';
import objectViewer from '@cloudbeaver/plugin-object-viewer';
import productInfoPlugin from '@cloudbeaver/plugin-product-info';
import sqlEditor from '@cloudbeaver/plugin-sql-editor';

import { defaultProductManifest } from './manifest';

const PLUGINS = [
  core,
  administration,
  spreadsheetNew,
  authentication,
  connectionCustom,
  connectionTemplate,
  dataExport,
  dataViewer,
  ddlViewer,
  objectViewer,
  sqlEditor,
  defaultProductManifest,
  connectionPlugin,
  productInfoPlugin,
];

bootstrap(PLUGINS);
