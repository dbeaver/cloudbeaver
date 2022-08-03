#!/usr/bin/env node

'use strict';
process.title = 'core-test-generate-results';

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const RESULTS_DIR_NAME = 'allure-results';
const RESULTS_DIR_PATH = path.resolve(__dirname, `../${RESULTS_DIR_NAME}`);
const PACKAGES_DIR_PATH = path.resolve(__dirname, '../..');
const CLI_DIR = path.resolve(__dirname, '..');
const BLUE = '\x1b[34m%s\x1b[0m';

/**
 * Creates a directory for all the reports
 */
function createResultsDir() {
  console.log(BLUE, `Creating a "${RESULTS_DIR_NAME}" directory...`);

  if (!fs.existsSync(RESULTS_DIR_PATH)) {
    fs.mkdirSync(RESULTS_DIR_PATH);
  }
}

/**
 * Generate a result for each package and copies it to the results dir
 */
function generateResults() {
  fs.readdir(PACKAGES_DIR_PATH, (error, items) => {
    if (error) {
      console.log(error);
      return;
    }

    items.forEach(item => {
      const itemPath = path.resolve(PACKAGES_DIR_PATH, item);
      fs.stat(itemPath, (error, stats) => {
        if (error) {
          console.error(error);
        }

        if (stats.isDirectory() && itemPath !== CLI_DIR) {
          try {
            console.log(BLUE, `Generating result for the ${item} package...`);
            execSync('yarn run test --reporters default jest-allure', { cwd: itemPath, stdio: 'inherit' });

            const resultPath = path.resolve(path.resolve(itemPath, RESULTS_DIR_NAME));

            if (fs.existsSync(resultPath)) {
              console.log(BLUE, `Copying the result for the ${item} package...`);
              fs.copySync(resultPath, path.resolve(RESULTS_DIR_PATH));
            }

          } catch (error) {
            console.error('Failed to generate result', error);
          }
        }
      });
    });
  });
}

createResultsDir();
generateResults();