var Web3 = require("web3");
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

const waitTransaction = require('wait-transaction')(web3)

contract('SmartPoolToken', function(accounts) {
  // StandardToken interfaces are tested on zepplin
  //  1. transfer
  //  2. transferFrom
  //  3. balanceOf
  //  4. approve
  //  5. allowance
  //  6. Transfer event
  //  7. Approval event
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

  var PREMINE_TOKEN = 10000;
  var RATE = 100;
  var firstAcc = accounts[0];
  var secondAcc = accounts[1];
  var beneficial = accounts[9];
  // 1. Constructor
  it("should issue " + PREMINE_TOKEN + " tokens to owner", function() {
    return SmartPoolToken.new(10000, beneficial).then(function(spt){
      return spt.getTokenBalance.call(firstAcc)
        .then(function(balance) {
          assert.equal(balance.valueOf(), 10000,
            "10000 wasn't in the first account");
        });
    });
  });

  // 2. totalSupply
  it("should have 10000 total supply", function(){
    return SmartPoolToken.new(10000, beneficial).then(function(spt){
      return spt.totalSupply.call(firstAcc)
        .then(function(supply){
          assert.equal(supply.valueOf(), 10000,
            "Total supply was not 10000")
      });
    });
  });

  // 3. accepting ether
  it("should accept ether and issue tokens to sender accounting to ether amount", function(){
    return spt = SmartPoolToken.new(10000, beneficial).then(function(spt){
      return waitTransaction({from: secondAcc, to: spt.address, value: web3.toWei("1", "ether"), gas: 1000000}).then(function(){
        return spt.getTokenBalance.call({from: secondAcc}).then(function(token){
          assert.equal(parseInt(token.valueOf()), RATE,
            "Issued tokens was not " + RATE);
        });
      });
    });
  });
  it("should not issue any tokens if donation amount is not enough for 1 token", function(){
    return spt = SmartPoolToken.new(10000, beneficial).then(function(spt){
      return waitTransaction({from: secondAcc, to: spt.address, value: web3.toWei("0.005", "ether"), gas: 1000000}).then(function(){
        return spt.getTokenBalance.call({from: secondAcc}).then(function(token){
          assert.equal(parseInt(token.valueOf()), 0,
            "Issued tokens was not " + 0);
        });
      });
    });
  });
  it("should increase donorCount by 1 and register donor's address to donors if the donor haven't donated", function(){
    return spt = SmartPoolToken.new(10000, beneficial).then(function(spt){
      return waitTransaction({from: secondAcc, to: spt.address, value: web3.toWei("0.005", "ether"), gas: 1000000}).then(function(){
        return spt.donorCount.call({from: secondAcc}).then(function(token){
          assert.equal(parseInt(token.valueOf()), 1,
            "donorCount was not " + 1);
        });
      });
    });
  });
  it("should not increase donorCount by 1 nor register donor's address to donors if the donor donated before", function(){
    return spt = SmartPoolToken.new(10000, beneficial).then(function(spt){
      return waitTransaction({from: secondAcc, to: spt.address, value: web3.toWei("1", "ether"), gas: 1000000}).then(function(){
        return waitTransaction({from: secondAcc, to: spt.address, value: web3.toWei("1", "ether"), gas: 1000000}).then(function(){
          return spt.donorCount.call({from: secondAcc}).then(function(token){
            assert.equal(parseInt(token.valueOf()), 1,
              "donorCount was not " + 1);
          });
        });
      });
    });
  });
  it("should throw if the amount is 0", function(){
    return spt = SmartPoolToken.new(10000, beneficial).then(function(spt){
      return waitTransaction({from: secondAcc, to: spt.address, value: 0, gas: 1000000}).then(function(){
        assert(false, "Transaction didn't throw");
      }, function(){
      });
    });
  });
  it("should increase totalFundRaised by the amount", function(){
    return spt = SmartPoolToken.new(10000, beneficial).then(function(spt){
      return waitTransaction({from: secondAcc, to: spt.address, value: web3.toWei("1", "ether"), gas: 1000000}).then(function(){
        return spt.totalFundRaised.call({from: secondAcc}).then(function(token){
          assert.equal(parseInt(token.valueOf()), web3.toWei("1", "ether"),
            "Issued tokens was not " + web3.toWei("1", "ether"));
        });
      });
    });
  });
  it("should increase totalFundRaised by the amount even if the amount is not enough for 1 token", function(){
    return spt = SmartPoolToken.new(10000, beneficial).then(function(spt){
      return waitTransaction({from: secondAcc, to: spt.address, value: web3.toWei("0.005", "ether"), gas: 1000000}).then(function(){
        return spt.totalFundRaised.call({from: secondAcc}).then(function(token){
          assert.equal(parseInt(token.valueOf()), web3.toWei("0.005", "ether"),
            "Issued tokens was not " + web3.toWei("0.005", "ether"));
        });
      });
    });
  });
  //  4. getDonationAmount
  it("should returns total amount in Wei donated by sender", function(){
    return spt = SmartPoolToken.new(10000, beneficial).then(function(spt){
      return waitTransaction({from: secondAcc, to: spt.address, value: web3.toWei("0.005", "ether"), gas: 1000000}).then(function(){
        return spt.getDonationAmount.call({from: secondAcc}).then(function(token){
          assert.equal(parseInt(token.valueOf()), web3.toWei("0.005", "ether"),
            "Issued tokens was not " + web3.toWei("0.005", "ether"));
        });
      });
    });
  });
  //  5. getTokenBalance
  it("should returns total tokens that sender is holding", function(){
    return spt = SmartPoolToken.new(10000, beneficial).then(function(spt){
      return waitTransaction({from: secondAcc, to: spt.address, value: web3.toWei("0.005", "ether"), gas: 1000000}).then(function(){
        return spt.getTokenBalance.call({from: secondAcc}).then(function(token){
          assert.equal(parseInt(token.valueOf()), 0,
            "Issued tokens was not 0");
        });
      });
    });
  });
  it("should returns total tokens that sender is holding", function(){
    return spt = SmartPoolToken.new(10000, beneficial).then(function(spt){
      return waitTransaction({from: secondAcc, to: spt.address, value: web3.toWei("2.1", "ether"), gas: 1000000}).then(function(){
        return spt.getTokenBalance.call({from: secondAcc}).then(function(token){
          assert.equal(parseInt(token.valueOf()), 210,
            "Issued tokens was not 210");
        });
      });
    });
  });
  //  6. tokenRate
  it("should returns the exchange rate of token", function(){
    return spt = SmartPoolToken.new(10000, beneficial).then(function(spt){
      return spt.tokenRate.call({from: secondAcc}).then(function(token){
        assert.equal(parseInt(token.valueOf()), 100,
          "Issued tokens was not 100");
      });
    });
  });
  //  7. changeRate
  it("should change the token exchange rate", function(){
    return spt = SmartPoolToken.new(10000, beneficial).then(function(spt){
      return spt.changeRate(500, {from: firstAcc}).then(function(){
        return spt.tokenRate.call({from: secondAcc}).then(function(token){
          assert.equal(parseInt(token.valueOf()), 500,
            "Issued tokens was not 500");
        });
      });
    });
  });
  it("should throw if the sender is not owner", function(){
    return spt = SmartPoolToken.new(10000, beneficial).then(function(spt){
      return spt.changeRate(500, {from: secondAcc}).then(function(){
        assert(false, "People who are not owner can call changeRate");
      }, function(){
        assert(true, "People who are not owner can call changeRate");
      });
    });
  });
  //  8. withdraw
  it("should send all balance to the beneficial", function(){
    return spt = SmartPoolToken.new(10000, beneficial).then(function(spt){
      return waitTransaction({from: secondAcc, to: spt.address, value: web3.toWei("2.1", "ether"), gas: 1000000}).then(function(){
        balanceBefore = parseInt(web3.eth.getBalance(beneficial));
        var assertFunc = function(){
          assert.equal(balanceBefore + parseInt(web3.toWei("2.1", "ether")), parseInt(web3.eth.getBalance(beneficial)),
            "Withdraw amount is not correct");
        };
        return spt.withdraw({from: firstAcc}).then(assertFunc);
      });
    });
  });
  it("should throw if sender is not the owner", function(){
    return spt = SmartPoolToken.new(10000, beneficial).then(function(spt){
      return spt.withdraw({from: secondAcc}).then(function(){
        assert(false, "People who are not owner can call withdraw");
      }, function(){
        assert(true, "People who are not owner can call withdraw");
      });
    });
  });
  //  9. stopAcceptingDonation
  it("should not accept any donation after stopAcceptingDonation", function(){
    return spt = SmartPoolToken.new(10000, beneficial).then(function(spt){
      return spt.stopAcceptingDonation({from: firstAcc}).then(function(){
        return waitTransaction({from: firstAcc, to: spt.address, value: 100, gas: 1000000}).then(function(){
          assert(false, "still accepts donation");
        }, function(){
          assert(true, "still accepts donation");
        });
      });
    });
  });
  it("should throw if the donation is already turned off", function(){
    return spt = SmartPoolToken.new(10000, beneficial).then(function(spt){
      return spt.stopAcceptingDonation({from: firstAcc}).then(function(){
        return spt.stopAcceptingDonation({from: firstAcc}).then(function(){
          assert(false, "still accepts donation");
        }, function(){
          assert(true, "still accepts donation");
        });
      });
    });
  });
  //  10. startAcceptingDonation
  it("should not refuse donations after startAcceptingDonation", function(){
    it("should not accept any donation after stopAcceptingDonation", function(){
      return spt = SmartPoolToken.new(10000, beneficial).then(function(spt){
        return waitTransaction({from: firstAcc, to: spt.address, value: 100, gas: 1000000}).then(function(){
          assert(true, "didn't accepts donation");
        }, function(){
          assert(false, "didn't accepts donation");
        });
      });
    });
  });
  it("should throw if the donation is already running", function(){
    return spt = SmartPoolToken.new(10000, beneficial).then(function(spt){
      return spt.startAcceptingDonation({from: firstAcc}).then(function(){
        assert(false, "still accepts donation");
      }, function(){
        assert(true, "still accepts donation");
      });
    });
  });
});
