import 'reflect-metadata';

import core, { bootstrap } from '@cloudbeaver/core-bootstrap';
import authentication from '@cloudbeaver/plugin-authentication';
import connectionCustom from '@cloudbeaver/plugin-connection-custom';
import connectionTemplate from '@cloudbeaver/plugin-connection-template';
import dataExport from '@cloudbeaver/plugin-data-export';
import spreadsheet from '@cloudbeaver/plugin-data-spreadsheet';
import dataViewer from '@cloudbeaver/plugin-data-viewer';
import ddlViewer from '@cloudbeaver/plugin-ddl-viewer';
import objectViewer from '@cloudbeaver/plugin-object-viewer';
import sqlEditor from '@cloudbeaver/plugin-sql-editor';

import { defaultProductManifest } from './manifest';

const PLUGINS = [
  core,
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
