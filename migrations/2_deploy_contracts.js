/* globals web3, artifacts */

const PreICOCrowdsale = artifacts.require('./PreICOCrowdsale.sol')
const ICOCrowdsale = artifacts.require('./ICOCrowdsale.sol')
const BitfexToken = artifacts.require('./BitfexToken.sol')

module.exports = function (deployer, network, accounts) {
  const preICO = {
    openingTime: web3.eth.getBlock('latest').timestamp + 2, // two secs in the future
    // openingTime: 1533081599, // Tue, 31 Jul 2018 23:59:59 UTC +00:00
    closingTime: 1534809599, // Mon, 20 Aug 2018 23:59:59 UTC +00:00
    price: new web3.BigNumber(web3.toWei(0.11, 'ether')), // preICO rate (1 wei is 10 token-bits)
    goal: new web3.BigNumber(web3.toWei(43, 'ether')), // preICO soft cap
    hardCap: 2000000 // 20000.00 BITFEX Tokens
  }
  const ICO = {
    openingTime: web3.eth.getBlock('latest').timestamp + 2, // two secs in the future
    // openingTime: 1535760000 // Sat, 01 Sep 2018 00:00:00 UTC +00:00
    closingTime: 1537487999, // Thu, 20 Sep 2018 23:59:59 UTC +00:00
    price: new web3.BigNumber(web3.toWei(0.65, 'ether')), // ICO rate (1 wei is 10 token-bits)
    goal: new web3.BigNumber(web3.toWei(19500, 'ether')), // ICO soft cap
    hardCap: 3000000 // 30000.00 BITFEX Tokens
  }

  const fundsWallet = accounts[1] // ETH funds wallet
  const ownersWallet = accounts[2] // wallet for tokens for owners
  const bountyWallet = accounts[3] // wallet for bounty tokens

  return deployer.then(async () => {
    const token = await deployer.deploy(BitfexToken)
    const preICOContract = await deployer.deploy(
      PreICOCrowdsale,
      preICO.openingTime,
      preICO.closingTime,
      preICO.price,
      preICO.goal,
      preICO.hardCap,
      fundsWallet,
      BitfexToken.address
    )
    const icoContract = await deployer.deploy(
      ICOCrowdsale,
      ICO.openingTime,
      ICO.closingTime,
      ICO.price,
      ICO.goal,
      ICO.hardCap,
      fundsWallet,
      BitfexToken.address
    )

    token.preallocate(preICOContract.address, icoContract.address, ownersWallet, bountyWallet)
  })
}
