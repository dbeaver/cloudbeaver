import 'reflect-metadata';

import { bootstrap } from '@cloudbeaver/core-bootstrap';
import type { PluginManifest } from '@cloudbeaver/core-di';
import administration from '@cloudbeaver/plugin-administration';
import authentication from '@cloudbeaver/plugin-authentication';
import authenticationAdministration from '@cloudbeaver/plugin-authentication-administration';
import connectionCustom from '@cloudbeaver/plugin-connection-custom';
import connectionTemplate from '@cloudbeaver/plugin-connection-template';
import connectionPlugin from '@cloudbeaver/plugin-connections';
import connectionAdministration from '@cloudbeaver/plugin-connections-administration';
import dataExport from '@cloudbeaver/plugin-data-export';
import spreadsheetNew from '@cloudbeaver/plugin-data-spreadsheet-new';
import dataViewer from '@cloudbeaver/plugin-data-viewer';
import ddlViewer from '@cloudbeaver/plugin-ddl-viewer';
import gisViewer from '@cloudbeaver/plugin-gis-viewer';
import objectViewer from '@cloudbeaver/plugin-object-viewer';
import productPlugin from '@cloudbeaver/plugin-product';
import sqlEditor from '@cloudbeaver/plugin-sql-editor';
import sqlEditorTab from '@cloudbeaver/plugin-sql-editor-navigation-tab';
import userProfile from '@cloudbeaver/plugin-user-profile';

import { defaultProductManifest } from './manifest';

const PLUGINS: PluginManifest[] = [
  administration,
  spreadsheetNew,
  authentication,
  authenticationAdministration,
  connectionCustom,
  connectionTemplate,
  dataExport,
  dataViewer,
  gisViewer,
  ddlViewer,
  objectViewer,
  sqlEditor,
  sqlEditorTab,
  userProfile,
  defaultProductManifest,
  connectionPlugin,
  connectionAdministration,
  productPlugin,
];

bootstrap(PLUGINS);
