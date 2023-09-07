const fs = require('fs');

function runModifyBuffer( path ) {
  const maxBuffer = '1024 * 1024 * 50';
  const maxBufferRequired = '1024 * 1024 * 1024';

  const nativeStrategy = fs.readFileSync(path, 'utf8');
  const modifiedNativeStrategy = nativeStrategy.replace(maxBuffer, maxBufferRequired);

  fs.writeFileSync(path, modifiedNativeStrategy);
}

let nativeStrategyPath = require.resolve("@truffle/compile-solidity/dist/compilerSupplier/loadingStrategies/Native.js");

if (fs.existsSync(nativeStrategyPath)) {
    return runModifyBuffer(nativeStrategyPath);
}

nativeStrategyPath = '../@truffle/compile-solidity/dist/compilerSupplier/loadingStrategies/Native.js';

if (fs.existsSync(nativeStrategyPath)) {
  return runModifyBuffer(nativeStrategyPath);
}
