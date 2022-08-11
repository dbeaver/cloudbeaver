const { join } = require('path');

reporter.allure.setOptions({ targetDir: join(__dirname, '../../allure-results') });