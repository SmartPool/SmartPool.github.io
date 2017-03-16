var Web3 = require('web3');
var publicNode = $.trim($('#public-node').text());
var web3 = new Web3(new Web3.providers.HttpProvider(publicNode));
var version = web3.version.api;
var smartPoolAddress = $.trim($('#smart-pool-address').text());
var smartPoolURL = $.trim($('#smart-pool-abi-url').text());

$.getJSON(smartPoolURL, function (data) {
  var contractABI = "";
  contractABI = JSON.parse(data.result);
  if (contractABI != ''){
    var smartPoolContract = web3.eth.contract(contractABI);
    var smartPoolInstance = smartPoolContract.at(smartPoolAddress);
    var updateTotalFund = function(contract) {
      var totalFundRaisedInWei = contract.totalFundRaised();
      var totalFundRaised = web3.fromWei(totalFundRaisedInWei, "ether");
      $('#total-fund-raised').text(totalFundRaised);
      $('#ether').removeClass('hide');
    };
    updateTotalFund(smartPoolInstance);
    setInterval(function(){
      updateTotalFund(smartPoolInstance);
    }, 30000);
  } else {
    console.log("We couldn't get information from Etherscan!" );
  }
});
