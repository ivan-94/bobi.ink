// 接收PluginAPI和项目配置
module.exports = (api, options) => {
  // ---------注册命令----------
  api.registerCommand(
    'foo',
    {
      description: '命令描述',
      usage: 'vue-cli-service foo [options]',
      options: {
        '--bar <pluginname>': '选项描述',
      }
    },
    args => {
      // 获取最终的webpack配置
      const config = api.resolveWebpackConfig()

      // 命令运行时
    })

  // -----扩展webpack配置-------
  api.chainWebpack(webpackConfig => {})</pluginname>