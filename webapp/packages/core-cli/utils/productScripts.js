const fs = require('fs');

const getProductScriptRegExps = packagesPath => fs.readdirSync(packagesPath).map(dir => new RegExp(`${dir}.*.js$`));

module.exports = {
  getProductScriptRegExps,
};
