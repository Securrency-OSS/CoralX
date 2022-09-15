const fs = require('fs');

const nativeStrategyPath = 'node_modules/@truffle/compile-solidity/dist/compilerSupplier/loadingStrategies/Native.js';

const maxBufferNative = '1024 * 1024 * 10';
const maxBufferRequired = '1024 * 1024 * 1024';

const nativeStrategy = fs.readFileSync(nativeStrategyPath, 'utf8');
const modifiedNativeStrategy = nativeStrategy.replace(maxBufferNative, maxBufferRequired);

fs.writeFileSync(nativeStrategyPath, modifiedNativeStrategy);
