/* globals artifacts, contract, it, assert, web3, expect */

const timeTravel = require('./timetravel.js')

const SECONDS_IN_A_DAY = 86400

const BitfexToken = artifacts.require('./BitfexToken.sol')
const PreICOCrowdsale = artifacts.require('./PreICOCrowdsale.sol')

const sleep = timeout => new Promise(resolve => {
  setTimeout(_ => resolve(), timeout)
})

contract('PreICOCrowdsale general checks', function (accounts) {
  it('have correct rate', async () => {
    const instance = await PreICOCrowdsale.deployed()

    const rate = await instance.rate()

    assert.equal(rate.valueOf(), web3.toWei(0.11, 'ether'), 'Rate should be 0.11 ETH')
  })

  it('preallocate tokens', async () => {
    const instance = await PreICOCrowdsale.deployed()
    const tokenAddress = await instance.token()
    const token = BitfexToken.at(tokenAddress)

    const preICOWallet = instance.address
    const ownersWallet = accounts[3] // wallet for tokens for owners
    const bountyWallet = accounts[4] // wallet for bounty tokens

    const preICOBalance = await token.balanceOf(preICOWallet)
    const ownersBalance = await token.balanceOf(ownersWallet)
    const bountyBalance = await token.balanceOf(bountyWallet)

    assert.equal(preICOBalance.valueOf(), 2000000, 'PreICO balance not equal 20 000.00 tokens')
    assert.equal(ownersBalance.valueOf(), 4000000, 'Owners balance not equal 40 000.00 tokens')
    assert.equal(bountyBalance.valueOf(), 1000000, 'Bounty balance not equal 10 000.00 tokens')
  })

  it('opened after two seconds after deployed', async () => {
    const instance = await PreICOCrowdsale.deployed()
    const opening = await instance.openingTime()

    await sleep(2000)

    assert.equal(Number(opening.valueOf()) < (new Date()) / 1000, true, 'preICO is opened')
  })
})

contract('PreICOCrowdsale sell checks', function (accounts) {
  it('sell tokens', async () => {
    const instance = await PreICOCrowdsale.deployed()

    await sleep(2000)

    web3.eth.sendTransaction({ from: accounts[0], to: instance.address, value: web3.toWei(0.11, 'ether'), gas: 100000 })

    const balance = await instance.balances(accounts[0])
    const raised = await instance.weiRaised()

    assert.equal(balance.valueOf(), 100) // 100 units is 1.00 BITFEX
    assert.equal(raised.valueOf(), web3.toWei(0.11, 'ether'))
  })

  it('correctly handle minimal amount (0.01 BITFEX)', async () => {
    const instance = await PreICOCrowdsale.deployed()

    await sleep(2000)

    web3.eth.sendTransaction({ from: accounts[1], to: instance.address, value: web3.toWei(0.0011, 'ether'), gas: 100000 })

    const balance = await instance.balances(accounts[1])

    assert.equal(balance.valueOf(), 1) // 1 unit is 0.01 BITFEX, minimal token amount
  })

  it('does not accept payments lesser than 0.0011 ether (0.01 BITFEX)', async () => {
    const instance = await PreICOCrowdsale.deployed()

    await sleep(2000)

    expect(_ => {
      web3.eth.sendTransaction({ from: accounts[2], to: instance.address, value: web3.toWei(0.0010, 'ether'), gas: 100000 })
    }).to.throw()

    const balance = await instance.balances(accounts[2])

    assert.equal(balance.valueOf(), 0)
  })

  it('does not sell more tokens than have', async () => {
    const instance = await PreICOCrowdsale.deployed()

    await sleep(2000)

    expect(_ => {
      web3.eth.sendTransaction({ from: accounts[3], to: instance.address, value: web3.toWei(2200.1, 'ether'), gas: 100000 })
    }).to.throw()

    const balance = await instance.balances(accounts[3])

    assert.equal(balance.valueOf(), 0)
  })
})

contract('PreICOCrowdsale full sell checks', function (accounts) {
  it('allow buy 20 000 tokens', async () => {
    const instance = await PreICOCrowdsale.deployed()

    await sleep(2000)

    web3.eth.sendTransaction({ from: accounts[0], to: instance.address, value: web3.toWei(1100, 'ether'), gas: 1000000 })
    web3.eth.sendTransaction({ from: accounts[1], to: instance.address, value: web3.toWei(1100, 'ether'), gas: 1000000 })

    const balance1 = await instance.balances(accounts[0])
    const balance2 = await instance.balances(accounts[1])

    assert.equal(balance1.valueOf(), 1000000)
    assert.equal(balance2.valueOf(), 1000000)
  })
})

contract('PreICOCrowdsale softcap checks', function (accounts) {
  it('disallow owners to withdraw funds while softcap not reached', async () => {
    const instance = await PreICOCrowdsale.deployed()

    await sleep(2000)

    web3.eth.sendTransaction({ from: accounts[1], to: instance.address, value: web3.toWei(1, 'ether'), gas: 100000 })

    const goalReached = await instance.goalReached()
    assert.equal(goalReached, false)

    const escrowBalance = await instance.escrowBalance.call()
    assert.equal(escrowBalance.valueOf(), web3.toWei(1, 'ether'))

    const ownerBalance = await web3.eth.getBalance(accounts[1])

    let failed = false
    try {
      await instance.beneficiaryWithdraw()
    } catch (e) {
      failed = true
    }
    assert.equal(failed, true, 'withdraw to beneficiary not failed')

    // check that nothing changed
    const newEscrowBalance = await instance.escrowBalance.call()
    assert.equal(newEscrowBalance.valueOf(), escrowBalance.valueOf())

    const newOwnerBalance = await web3.eth.getBalance(accounts[1])
    assert.equal(newOwnerBalance.valueOf(), ownerBalance.valueOf())
  })

  it('reach goal after softcap', async () => {
    const instance = await PreICOCrowdsale.deployed()

    await sleep(2000)

    web3.eth.sendTransaction({ from: accounts[5], to: instance.address, value: web3.toWei(43, 'ether'), gas: 100000 })

    const balance = await instance.balances(accounts[5])
    const goalReached = await instance.goalReached()

    assert.equal(balance.valueOf(), 39090)
    assert.equal(goalReached, true)
  })

  it('allow beneficiary withdraw after softcap', async () => {
    const instance = await PreICOCrowdsale.deployed()

    await sleep(2000)

    const goalReached = await instance.goalReached()
    assert.equal(goalReached, true)

    const escrowBalance = await instance.escrowBalance.call()
    assert.equal(escrowBalance.valueOf(), web3.toWei(44, 'ether'))

    const ownerBalance = await web3.eth.getBalance(accounts[1])

    instance.updateEscrowGoalReached()
    await instance.beneficiaryWithdraw()

    // check that nothing changed
    const newEscrowBalance = await instance.escrowBalance.call()
    assert.equal(newEscrowBalance.valueOf(), 0, 'Escrow wallet is not empty')

    const newOwnerBalance = await web3.eth.getBalance(accounts[1])
    assert.equal(newOwnerBalance.valueOf(), Number(ownerBalance.valueOf()) + Number(escrowBalance.valueOf()), 'Owner balance not increased')
  })
})

contract('PreICOCrowdsale after ICO checks', function (accounts) {
  it('allow withdraw tokens', async () => {
    const instance = await PreICOCrowdsale.deployed()
    const tokenAddress = await instance.token()
    const token = BitfexToken.at(tokenAddress)

    await sleep(2000)

    web3.eth.sendTransaction({ from: accounts[1], to: instance.address, value: web3.toWei(1, 'ether'), gas: 100000 })

    await timeTravel(SECONDS_IN_A_DAY * 60)

    instance.finalize()

    instance.withdrawTokens({ from: accounts[1] })

    const userBalance = await token.balanceOf(accounts[1])

    assert.equal(userBalance.valueOf(), 909)
  })
})
