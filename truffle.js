/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() {
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>')
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gas: 4600000
    },
    ropsten: {
      host: 'localhost',
      port: 8545,
      network_id: '3', // RepstenID 3
      from: '0xB54B6DC3dE5fA16ff2B66465D0200e6a3b693c47', // account from which to deploy
      gas: 6000000
    },
    main: {
      host: 'localhost',
      port: 8545,
      network_id: '1', // MainNet
      from: '0xdfc38911f6e0bfdd0472f6f68d83e8a0115768b2', // account from which to deploy
      gas: 6000000,
      gasPrice: 1000000000
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
}
