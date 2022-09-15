const path = require('path');
const webpack = require('webpack');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const distPath = path.resolve(__dirname, 'dist');
const mochaPath = 'node_modules/mocha';
const trufflePath = 'node_modules/@truffle';

module.exports = {
    target: 'node',
    mode: 'production',
    entry: './index.js',
    output: {
        filename: 'coralX.build.js',
        path: distPath
    },
    plugins: [
        new webpack.BannerPlugin({ banner: '#!/usr/bin/env node', raw: true }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, mochaPath),
                    to: path.join(distPath, mochaPath)
                },
                {
                    from: path.resolve(__dirname, trufflePath),
                    to: path.join(distPath, trufflePath)
                }
            ],
        }),
        new CleanWebpackPlugin(),
        // Make web3 1.0 packable
        new webpack.IgnorePlugin({resourceRegExp: /^electron$/})
    ],
    externals: {
        '@truffle/config': 'commonjs @truffle/config',
        '@truffle/workflow-compile': 'commonjs @truffle/workflow-compile',

        'mocha': 'commonjs mocha'
    },
    optimization: {
        minimize: false
    }
}
