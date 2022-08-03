#!/usr/bin/env node

'use strict';
process.title = 'core-test-generate-report';

const allure = require('allure-commandline');

function generateReport() {
  const generation = allure(['generate', 'allure-results']);

  generation.on('exit', exitCode => {
    console.log('Generation is finished with code:', exitCode);
  });
}

generateReport();