var Web3 = require("web3");
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

const assertJump = require('./helpers/assertJump');

contract('SmartPoolToken', function(accounts) {
  var PREMINE_TOKEN = 600000;
  var RATE = 100;
  var firstAcc = accounts[0];
  var secondAcc = accounts[1];
  var beneficial = accounts[9];
  // StandardToken interfaces are tested on zepplin
  //  1. transfer
  //  2. transferFrom
  //  3. balanceOf
  //  4. approve
  //  5. allowance
  //  6. Transfer event
  //  7. Approval event
  it("should return the correct totalSupply after construction", async function() {
    let token = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    let totalSupply = await token.totalSupply();

    assert.equal(totalSupply, PREMINE_TOKEN);
  })

  it("should return the correct allowance amount after approval", async function() {
    let token = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    let approve = await token.approve(accounts[1], 100);
    let allowance = await token.allowance(accounts[0], accounts[1]);

    assert.equal(allowance, 100);
  });

  it("should return correct balances after transfer", async function() {
    let token = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    let transfer = await token.transfer(accounts[1], PREMINE_TOKEN);
    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);

    let balance1 = await token.balanceOf(accounts[1]);
    assert.equal(balance1, PREMINE_TOKEN);
  });

  it("should throw an error when trying to transfer more than balance", async function() {
    let token = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    try {
      let transfer = await token.transfer(accounts[1], 101);
    } catch(error) {
      assertJump(error);
    }
  });

  it("should return correct balances after transfering from another account", async function() {
    let token = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    let approve = await token.approve(accounts[1], PREMINE_TOKEN);
    let transferFrom = await token.transferFrom(accounts[0], accounts[2], PREMINE_TOKEN, {from: accounts[1]});

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);

    let balance1 = await token.balanceOf(accounts[2]);
    assert.equal(balance1, PREMINE_TOKEN);

    let balance2 = await token.balanceOf(accounts[1]);
    assert.equal(balance2, 0);
  });

  it("should throw an error when trying to transfer more than allowed", async function() {
    let token = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    let approve = await token.approve(accounts[1], 99);
    try {
      let transfer = await token.transferFrom(accounts[0], accounts[2], 100, {from: accounts[1]});
    } catch (error) {
      assertJump(error);
    }
  });
  // ======================================================
  // Test about SmartPookToken functionalities rather
  // than StandardToken
  //  1. Constructor
  //  2. totalSupply
  //  3. accepting ether
  //  4. getDonationAmount
  //  5. getTokenBalance
  //  6. tokenRate
  //  7. changeRate
  //  8. withdraw
  //  9. stopAcceptingDonation
  //  10. startAcceptingDonation
  //  11. TokenMint event
  //  12. Donated event

  // 1. Constructor
  it("should issue " + PREMINE_TOKEN + " tokens to owner", async function() {
    let spt = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    let balance = await spt.getTokenBalance({from: firstAcc});
    assert.equal(balance.valueOf(), PREMINE_TOKEN, PREMINE_TOKEN + " wasn't in the first account");
  });

  // 2. totalSupply
  it("should have " + PREMINE_TOKEN + " total supply", async function(){
    let spt = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    let supply = await spt.totalSupply({from: firstAcc});
    assert.equal(supply.valueOf(), PREMINE_TOKEN, "Total supply was not " + PREMINE_TOKEN)
  });

  // 3. accepting ether
  it("should accept ether and issue tokens propotional to ether amount", async function(){
    let spt = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    await web3.eth.sendTransaction({from: secondAcc, to: spt.address, value: web3.toWei("1", "ether"), gas: 1000000});
    let token = await spt.getTokenBalance({from: secondAcc})
    assert.equal(parseInt(token.valueOf()), RATE, "Issued tokens was not " + RATE);
  });
  it("should not issue any tokens if donation amount is not enough for 1 token", async function(){
    let spt = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    await web3.eth.sendTransaction({from: secondAcc, to: spt.address, value: web3.toWei("0.005", "ether"), gas: 1000000});
    let token = await spt.getTokenBalance.call({from: secondAcc});
    assert.equal(parseInt(token.valueOf()), 0, "Issued tokens was not " + 0);
  });
  it("should increase donorCount by 1 and register donor's address to donors if the donor haven't donated before", async function(){
    let spt = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    await web3.eth.sendTransaction({from: secondAcc, to: spt.address, value: web3.toWei("0.005", "ether"), gas: 1000000});
    let token = await spt.donorCount.call({from: secondAcc});
    assert.equal(parseInt(token.valueOf()), 1, "donorCount was not " + 1);
  });
  it("should not increase donorCount by 1 nor register donor's address to donors if the donor donated before", async function(){
    let spt = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    await web3.eth.sendTransaction({from: secondAcc, to: spt.address, value: web3.toWei("1", "ether"), gas: 1000000});
    await web3.eth.sendTransaction({from: secondAcc, to: spt.address, value: web3.toWei("1", "ether"), gas: 1000000});
    let token = await spt.donorCount.call({from: secondAcc});
    assert.equal(parseInt(token.valueOf()), 1, "donorCount was not " + 1);
  });
  it("should throw if the amount is 0", async function(){
    let spt = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    try {
      await web3.eth.sendTransaction({from: secondAcc, to: spt.address, value: 0, gas: 1000000});
    } catch (error) {
      assertJump(error);
    }
  });
  it("should increase totalFundRaised by the amount", async function(){
    let spt = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    await web3.eth.sendTransaction({from: secondAcc, to: spt.address, value: web3.toWei("1", "ether"), gas: 1000000});
    let token = await spt.totalFundRaised.call({from: secondAcc});
    assert.equal(parseInt(token.valueOf()), web3.toWei("1", "ether"),
      "Issued tokens was not " + web3.toWei("1", "ether"));
  });
  it("should increase totalFundRaised by the amount even if the amount is not enough for 1 token", async function(){
    let spt = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    await web3.eth.sendTransaction({from: secondAcc, to: spt.address, value: web3.toWei("0.005", "ether"), gas: 1000000});
    let token = await spt.totalFundRaised.call({from: secondAcc});
    assert.equal(parseInt(token.valueOf()), web3.toWei("0.005", "ether"),
      "Issued tokens was not " + web3.toWei("0.005", "ether"));
  });
  //  4. getDonationAmount
  it("should returns total amount in Wei donated by sender", async function(){
    let spt = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    await web3.eth.sendTransaction({from: secondAcc, to: spt.address, value: web3.toWei("0.005", "ether"), gas: 1000000});
    let token = await spt.getDonationAmount.call({from: secondAcc});
    assert.equal(parseInt(token.valueOf()), web3.toWei("0.005", "ether"),
      "Issued tokens was not " + web3.toWei("0.005", "ether"));
  });
  //  5. getTokenBalance
  it("should returns total tokens that sender is holding", async function(){
    let spt = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    await web3.eth.sendTransaction({from: secondAcc, to: spt.address, value: web3.toWei("0.005", "ether"), gas: 1000000});
    let token = await spt.getTokenBalance.call({from: secondAcc});
    assert.equal(parseInt(token.valueOf()), 0, "Issued tokens was not 0");

    await web3.eth.sendTransaction({from: secondAcc, to: spt.address, value: web3.toWei("2.1", "ether"), gas: 1000000});
    token = await spt.getTokenBalance.call({from: secondAcc});
    assert.equal(parseInt(token.valueOf()), 210, "Issued tokens was not 210");
  });
  //  6. tokenRate
  it("should returns the exchange rate of token", async function(){
    let spt = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    let token = await spt.tokenRate.call({from: secondAcc});
    assert.equal(parseInt(token.valueOf()), 100, "Issued tokens was not 100");
  });
  //  7. changeRate
  it("should change the token exchange rate", async function(){
    let spt = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    await spt.changeRate(500, {from: firstAcc});
    let token = await spt.tokenRate.call({from: secondAcc});
    assert.equal(parseInt(token.valueOf()), 500, "Issued tokens was not 500");
  });
  it("should throw if the sender is not owner", async function(){
    let spt = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    try {
      await spt.changeRate(500, {from: secondAcc});
    } catch (error) {
      assertJump(error);
    }
  });
  //  8. withdraw
  it("should send all balance to the beneficial", async function(){
    let spt = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    await web3.eth.sendTransaction({from: secondAcc, to: spt.address, value: web3.toWei("2.1", "ether"), gas: 1000000});
    let balanceBefore = parseInt(await web3.eth.getBalance(beneficial));
    await spt.withdraw({from: firstAcc});
    assert.equal(balanceBefore + parseInt(web3.toWei("2.1", "ether")),
      parseInt(await web3.eth.getBalance(beneficial)), "Withdraw amount is not correct");
  });
  it("should throw if sender is not the owner", async function(){
    let spt = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    try{
      await spt.withdraw({from: secondAcc});
    } catch (error) {
      assertJump(error);
    }
  });
  //  9. stopAcceptingDonation
  it("should not accept any donation after stopAcceptingDonation", async function(){
    let spt = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    await spt.stopAcceptingDonation({from: firstAcc});
    try {
      await web3.eth.sendTransaction({from: firstAcc, to: spt.address, value: 100, gas: 1000000});
    } catch (error) {
      assertJump(error);
    }
  });
  it("should throw if the donation is already turned off", async function(){
    let spt = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    await spt.stopAcceptingDonation({from: firstAcc});
    try {
      await spt.stopAcceptingDonation({from: firstAcc});
    } catch (error) {
      assertJump(error);
    }
  });
  //  10. startAcceptingDonation
  it("should not refuse donations after startAcceptingDonation", async function(){
    let spt = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    await web3.eth.sendTransaction({from: firstAcc, to: spt.address, value: 100, gas: 1000000});
    return;
  });
  it("should throw if the donation is already running", async function(){
    let spt = await SmartPoolToken.new(PREMINE_TOKEN, beneficial);
    try {
      await spt.startAcceptingDonation({from: firstAcc});
    } catch (error) {
      assertJump(error);
    }
  });
});
