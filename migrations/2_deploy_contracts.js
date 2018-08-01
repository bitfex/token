/* globals web3, artifacts */

const PreICOCrowdsale = artifacts.require('./PreICOCrowdsale.sol')
const ICOCrowdsale = artifacts.require('./ICOCrowdsale.sol')
const BitfexToken = artifacts.require('./BitfexToken.sol')

const startDate = {
  development: web3.eth.getBlock('latest').timestamp + 2,
  ropsten: web3.eth.getBlock('latest').timestamp + 600,
  main: 1533081599 // Tue, 31 Jul 2018 23:59:59 UTC +00:00
}

const stopDate = {
  development: web3.eth.getBlock('latest').timestamp + 6000,
  ropsten: web3.eth.getBlock('latest').timestamp + 6000,
  main: 1534809599 // Mon, 20 Aug 2018 23:59:59 UTC +00:00
}

const wallets = accounts => ({
  development: {
    preFundsWallet: accounts[1], // ETH funds wallet
    fundsWallet: accounts[2], // ETH funds wallet
    ownersWallet: accounts[3], // wallet for tokens for owners
    bountyWallet: accounts[4] // wallet for bounty tokens
  },
  ropsten: {
    preFundsWallet: '0xf541FcF1d7E136755AbDdfD5179e10946c87035c', // ETH funds wallet
    fundsWallet: '0xCd31A28fCE692502C0a126e1B767Fa6973987844', // ETH funds wallet
    ownersWallet: '0x176Af7D85842d50B7966a4C542DbB3e66d48a0cF', // wallet for tokens for owners
    bountyWallet: '0xE15D7818637598F518F9bfa6bAA0E26CD713e0b3' // wallet for bounty tokens
  },
  main: {
    preFundsWallet: '0x0327c5021bcefa94e0781e9bf4a6722d5ce420eb', // ETH funds wallet
    fundsWallet: '0xadc6f5ff3649a96b7f3dda3244263d28e104bf14', // ETH funds wallet
    ownersWallet: '0xf30d12be7a4007a0ccc809705b07390467e4f255', // wallet for tokens for owners
    bountyWallet: '0x939331ec1d22b358881b10161b63e06fd980c300' // wallet for bounty tokens
  }
})

module.exports = function (deployer, network, accounts) {
  const preICO = {
    openingTime: startDate[network], // two secs in the future
    closingTime: stopDate[network], // Mon, 20 Aug 2018 23:59:59 UTC +00:00
    price: new web3.BigNumber(web3.toWei(0.11, 'ether')), // preICO rate (1 wei is 10 token-bits)
    goal: new web3.BigNumber(web3.toWei(43, 'ether')), // preICO soft cap
    hardCap: 2000000 // 20000.00 BITFEX Tokens
  }
  const ICO = {
    openingTime: 1535760000, // Sat, 01 Sep 2018 00:00:00 UTC +00:00
    closingTime: 1541030399, // Wed, 31 Oct 2018 23:59:59 UTC +00:00
    price: new web3.BigNumber(web3.toWei(0.65, 'ether')), // ICO rate (1 wei is 10 token-bits)
    goal: new web3.BigNumber(web3.toWei(1000, 'ether')), // ICO soft cap
    hardCap: 3000000 // 30000.00 BITFEX Tokens
  }

  const preFundsWallet = wallets(accounts)[network].preFundsWallet // ETH funds wallet
  const fundsWallet = wallets(accounts)[network].fundsWallet // ETH funds wallet
  const ownersWallet = wallets(accounts)[network].ownersWallet // wallet for tokens for owners
  const bountyWallet = wallets(accounts)[network].bountyWallet // wallet for bounty tokens

  return deployer.then(async () => {
    const token = await deployer.deploy(BitfexToken, { gasPrice: 1000000000, gas: 6000000 })
    const preICOContract = await deployer.deploy(
      PreICOCrowdsale,
      preICO.openingTime,
      preICO.closingTime,
      preICO.price,
      preICO.goal,
      preICO.hardCap,
      preFundsWallet,
      BitfexToken.address,
      { gasPrice: 1000000000, gas: 6000000 }
    )
    const icoContract = await deployer.deploy(
      ICOCrowdsale,
      ICO.openingTime,
      ICO.closingTime,
      ICO.price,
      ICO.goal,
      ICO.hardCap,
      fundsWallet,
      BitfexToken.address,
      { gasPrice: 1000000000, gas: 6000000 }
    )

    token.preallocate(preICOContract.address, icoContract.address, ownersWallet, bountyWallet)
  })
}
