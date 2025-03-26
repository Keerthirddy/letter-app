module.exports = function override(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
      util: require.resolve('util/'),
      url: require.resolve('url/'),
      https: require.resolve('https-browserify'),
      querystring: require.resolve('querystring-es3'),
      http: require.resolve('stream-http'),
      assert: require.resolve('assert/'),
      os: require.resolve('os-browserify/browser'),
      path: require.resolve('path-browserify'),
      crypto: require.resolve('crypto-browserify'),
      process: require.resolve('process/browser'),
      zlib: require.resolve('browserify-zlib'),
      fs: false,
      net: false,
      tls: false,
      child_process: false,
      http2: false,
    };
  
    config.resolve.alias = {
      ...config.resolve.alias,
      'node:events': 'events',
      'node:process': 'process/browser',
      'node:util': 'util',
    };
  
    // Add this to handle any other node: scheme imports
    config.module = {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /\.js$/,
          enforce: 'pre',
          use: [
            {
              loader: 'babel-loader',
              options: {
                plugins: [
                  [
                    '@babel/plugin-transform-modules-commonjs',
                    {
                      allowTopLevelThis: true,
                    },
                  ],
                ],
              },
            },
          ],
        },
      ],
    };
  
    return config;
  };