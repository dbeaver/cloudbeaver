const postcss = require('postcss')

function isModuleFile(file) {
  return /\.module\.[a-z]{2,6}$/.test(file)
}

module.exports =  {
  name: 'reshadow-loader',
  alwaysProcess: true,
  // `test` option is dynamically set in ./loaders
  async process({ code, map }) {

    const postcssOptions = {
      to: this.id,
      from: this.id,
      map: false,
    };

    console.log(this.id)

    const moduleScope = isModuleFile(this.id) ? 'local' : 'global';

    const plugins = [
      require('reshadow/postcss')({ scopeBehaviour: moduleScope })
    ]

    const result = await postcss(plugins).process(code, postcssOptions)

    for (const message of result.messages) {
      if (message.type === 'dependency') {
        this.dependencies.add(message.file)
      }
    }

    for (const warning of result.warnings()) {
      if (!warning.message) {
        warning.message = warning.text
      }

      this.warn(warning)
    }

    return {
      code: result.css,
      map: map,
    }
  }
}
