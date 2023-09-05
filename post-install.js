const fs = require('fs');

const nativeStrategyPath = `${__dirname}/node_modules/@truffle/compile-solidity/dist/compilerSupplier/loadingStrategies/Native.js`;

const maxBuffer = '1024 * 1024 * 50';
const maxBufferRequired = '1024 * 1024 * 1024';

const nativeStrategy = fs.readFileSync(nativeStrategyPath, 'utf8');
const modifiedNativeStrategy = nativeStrategy.replace(maxBuffer, maxBufferRequired);

fs.writeFileSync(nativeStrategyPath, modifiedNativeStrategy);
