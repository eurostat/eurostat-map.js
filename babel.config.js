module.exports = function (api) {
  const presets = [
    ['@babel/env', {
      targets: {
        edge: '17',
        firefox: '60',
        chrome: '69',
        safari: '11.1',
        ie: '11'
      },
      useBuiltIns: 'entry',
      corejs: '3'
    }]
  ]

  api.cache(true)
  api.debug = true;

  const plugins = []

  return {
    presets,
    plugins
  }
}
