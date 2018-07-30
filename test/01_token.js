/* globals artifacts, contract, it, assert */

const BitfexToken = artifacts.require('./BitfexToken.sol')

contract('BitfexToken', function (accounts) {
  it('should have correct TOTAL_SUPPLY', async () => {
    const instance = await BitfexToken.deployed()
    const supply = await instance.TOTAL_SUPPLY()

    assert.equal(supply.valueOf(), 10000000, 'Total supply is not equal to 100_000.00')
  })

  it('correctly run preallocate', async () => {
    const instance = await BitfexToken.deployed()

    const preICOWallet = accounts[9]
    const ICOWallet = accounts[8]
    const ownersWallet = accounts[7]
    const bountyWallet = accounts[6]

    await instance.preallocate(preICOWallet, ICOWallet, ownersWallet, bountyWallet)

    const preICOBalance = await instance.balanceOf(preICOWallet)
    const ICOBalance = await instance.balanceOf(ICOWallet)
    const ownersBalance = await instance.balanceOf(ownersWallet)
    const bountyBalance = await instance.balanceOf(bountyWallet)

    assert.equal(preICOBalance.valueOf(), 2000000, 'PreICO balance not equal 20 000.00 tokens')
    assert.equal(ICOBalance.valueOf(), 3000000, 'ICO balance not equal 30 000.00 tokens')
    assert.equal(ownersBalance.valueOf(), 4000000, 'Owners balance not equal 40 000.00 tokens')
    assert.equal(bountyBalance.valueOf(), 1000000, 'Bounty balance not equal 10 000.00 tokens')
  })
})
