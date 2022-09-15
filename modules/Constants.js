module.exports = {
    PROCESS_TYPE_MIGRATIONS: 'migrations',
    PROCESS_TYPE_CONFIGURATIONS: 'configurations',
    PROCESS_TYPE_TEST: 'test',
    PROCESS_TYPE_CUSTOM_SCRIPT: 'custom',
    SUPPORTED_COMPILERS: ['solc'],
    TX_OVERRIDES: [
        'gasPrice',
        'gasLimit',
        'gas',
        'value',
        'nonce',
        'from',
    ],
};
