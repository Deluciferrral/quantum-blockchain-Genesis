const path = require('path');

module.exports = {
  entry: './src/index.js',
  target: 'node',
  mode: process.env.NODE_ENV || 'development',
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true
  },
  
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  
  externals: {
    // Exclude Node.js built-in modules
    'crypto': 'crypto',
    'fs': 'fs',
    'path': 'path',
    'events': 'events'
  },
  
  resolve: {
    extensions: ['.js', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 3001,
    hot: true
  }
};