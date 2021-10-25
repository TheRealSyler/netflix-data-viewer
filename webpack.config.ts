import { Configuration } from 'webpack';
import { Configuration as Dev } from 'webpack-dev-server';
import { resolve } from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
// const WebpackBundleAnalyzer = require('webpack-bundle-analyzer');

type C = { devServer?: Dev } & Configuration

const config: C = {
  entry: {
    index: `${__dirname}/src/index.ts`,
  },
  output: {
    path: resolve(__dirname, 'dist'),
    chunkFilename: '[name].chunk.js',
    filename: '[name].bundle.js',
    publicPath: '/',
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: `${__dirname}/public/index.html`,
    }),
    new ForkTsCheckerWebpackPlugin(),
    // new WebpackBundleAnalyzer.BundleAnalyzerPlugin()
  ],
  module: {
    rules: [
      {
        test: /.s[ac]ss$/i,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /.tsx?$/,
        loader: 'babel-loader',
      },
      {
        test: /.(eot|woff2?|svg|ttf|png|jpe?g)([?]?.*)$/,
        loader: 'file-loader',
        sideEffects: true,
      },
      {
        test: /\.txt$|\.data$/i,
        use: 'raw-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  devServer: {
    historyApiFallback: true,
    allowedHosts: ['localhost'],
    publicPath: '/',
  },
  optimization: {
    usedExports: true,
    splitChunks: {
      chunks: 'all',
      minSize: 2000,
    },
  },
};

module.exports = config;
