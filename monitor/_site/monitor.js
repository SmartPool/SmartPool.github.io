var noClientError = function(){
    alert("Could not find an ethereum client");             
    //$("#before_load").html("<h1>Could not find an ethereum client</h1>");
    return -1;
};

var handleError = function(err){
    alert(err.toString());             
    //$("#before_load").html("<h1>Could not find an ethereum client</h1>");
    return -1;
};



var globalWeb3;
var globalContractInstance;
var contractAddress = "0xdead49c9398a34ca8bacaaab0e1af098f0b20733"
var contractABI = [{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"owners","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"newVersionReleased","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"getPoolETHBalance","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"uncleRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"creationBlockNumber","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"sender","type":"address"}],"name":"canRegister","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"poolFees","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"header","type":"bytes32"},{"name":"nonceLe","type":"bytes8"},{"name":"dataSetLookup","type":"uint256[]"},{"name":"witnessForLookup","type":"uint256[]"},{"name":"epochIndex","type":"uint256"}],"name":"hashimoto","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"paymentAddress","type":"address"}],"name":"register","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_uncleRate","type":"uint256"},{"name":"_poolFees","type":"uint256"}],"name":"setUnlceRateAndFees","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"sender","type":"address"}],"name":"getAverageDifficulty","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"epochIndex","type":"uint256"},{"name":"nodeIndex","type":"uint256"}],"name":"getEpochData","outputs":[{"name":"","type":"uint256[3]"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"version","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"sender","type":"address"},{"name":"seed","type":"uint256"}],"name":"calculateSubmissionIndex","outputs":[{"name":"","type":"uint256[2]"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"sender","type":"address"}],"name":"getClaimSeed","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"rootHash","type":"uint256"},{"name":"rootMin","type":"uint256"},{"name":"rootMax","type":"uint256"},{"name":"leafHash","type":"uint256"},{"name":"leafCounter","type":"uint256"},{"name":"branchIndex","type":"uint256"},{"name":"countersBranch","type":"uint256[]"},{"name":"hashesBranch","type":"uint256[]"}],"name":"verifyAgtDebugForTesting","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"sender","type":"address"},{"name":"seed","type":"uint256"},{"name":"submissionNumber","type":"uint256"},{"name":"shareIndex","type":"uint256"}],"name":"verifySubmissionIndex","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"miner","type":"address"},{"name":"add","type":"bool"}],"name":"updateWhiteList","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"rlpHeader","type":"bytes"},{"name":"nonce","type":"uint256"},{"name":"submissionIndex","type":"uint256"},{"name":"shareIndex","type":"uint256"},{"name":"dataSetLookup","type":"uint256[]"},{"name":"witnessForLookup","type":"uint256[]"},{"name":"augCountersBranch","type":"uint256[]"},{"name":"augHashesBranch","type":"uint256[]"}],"name":"verifyClaim","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"sender","type":"address"}],"name":"isRegistered","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"epochIndex","type":"uint256"}],"name":"isEpochDataSet","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"epoch","type":"uint256"},{"name":"fullSizeIn128Resultion","type":"uint256"},{"name":"branchDepth","type":"uint256"},{"name":"merkleNodes","type":"uint256[]"},{"name":"start","type":"uint256"},{"name":"numElems","type":"uint256"}],"name":"setEpochData","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"numShares","type":"uint256"},{"name":"difficulty","type":"uint256"},{"name":"min","type":"uint256"},{"name":"max","type":"uint256"},{"name":"augRoot","type":"uint256"},{"name":"lastClaimBeforeVerification","type":"bool"}],"name":"submitClaim","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"sender","type":"address"}],"name":"getMinerId","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"whiteListEnabled","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"declareNewerVersion","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"existingIds","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"id","type":"uint256"},{"name":"numChars","type":"uint256"}],"name":"to62Encoding","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"inputs":[{"name":"_owners","type":"address[3]"},{"name":"_whiteListEnabeled","type":"bool"}],"payable":true,"type":"constructor"},{"payable":true,"type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"miner","type":"address"},{"indexed":false,"name":"time","type":"uint256"},{"indexed":false,"name":"numShares","type":"uint256"},{"indexed":false,"name":"difficulty","type":"uint256"}],"name":"ValidShares","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":false,"name":"error","type":"uint256"},{"indexed":false,"name":"errorInfo","type":"uint256"}],"name":"Register","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"miner","type":"address"},{"indexed":false,"name":"error","type":"uint256"},{"indexed":false,"name":"errorInfo","type":"uint256"},{"indexed":false,"name":"add","type":"bool"}],"name":"UpdateWhiteList","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":false,"name":"error","type":"uint256"},{"indexed":false,"name":"errorInfo","type":"uint256"}],"name":"VerifyExtraData","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":false,"name":"error","type":"uint256"},{"indexed":false,"name":"errorInfo","type":"uint256"}],"name":"VerifyClaim","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"sender","type":"address"},{"indexed":false,"name":"amountInWei","type":"uint256"}],"name":"IncomingFunds","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":false,"name":"error","type":"uint256"},{"indexed":false,"name":"errorInfo","type":"uint256"}],"name":"SetUnlceRateAndFees","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":false,"name":"error","type":"uint256"},{"indexed":false,"name":"errorInfo","type":"uint256"}],"name":"SubmitClaim","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"error","type":"uint256"},{"indexed":false,"name":"index","type":"uint256"}],"name":"VerifyAgt","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":false,"name":"error","type":"uint256"},{"indexed":false,"name":"errorInfo","type":"uint256"}],"name":"SetEpochData","type":"event"}];

window.addEventListener('load', function() {
    var web3 = new Web3(new Web3.providers.HttpProvider("http://52.187.131.96:8545"));
    //alert(web3.toString());
    /*
    alert(web3.isConnected());
    if( ! web3.isConnected()) return noClientError();
    else{
        return noClientError();    
    }*/
    globalWeb3 = web3;
    
    var testPoolABI = web3.eth.contract(contractABI);
    globalContractInstance = testPoolABI.at(contractAddress); 

    allDealsPage();
});

function eventDisplay(eventType, eventArgs, blockNumber ) {
    var toInt = function(bigNumber){
        return parseInt(bigNumber.toString());  
    };

    this.sender = eventArgs.sender;
    this.error = eventArgs.error;
    this.errorInfo = eventArgs.errorInfo;
    this.eventType = eventType;
    this.blockNumber = blockNumber;
    
    this.toText = function() {
        var string = this.blockNumber.toString(10) + "   " +  
        this.eventType + " : " + this.sender.toString(16) + " ";
        if( toInt(this.error) === 0 ) string += "OK";
        else string += "ERROR!!! " + "0x" + this.error.toString(16) + " " + "0x" + this.errorInfo.toString(16);
        
        return string;
    };
}    
    

var sortEvents = function( events ) {
    var toInt = function(bigNumber){
        return parseInt(bigNumber.toString());  
    };

    var result = [];
    var minElem = 0;
    var nextMinElem = 0xFFFFFFFF;
    
    do {
        nextMinElem = 0xFFFFFFFF;
        
        for( var i = 0 ; i < events.length ; i++ ) {
            if( toInt(events[i].blockNumber) == minElem ) {
                result.push(events[i]);
            }
            else if( toInt(events[i].blockNumber) > minElem ) {
                if( toInt(events[i].blockNumber) < nextMinElem ) {
                    nextMinElem = events[i].blockNumber; 
                }
            }        
        }
        
        minElem = nextMinElem;
    } while( nextMinElem != 0xFFFFFFFF );
    
    return result;
};


var makeAllDealsTable = function(){    
    var event = globalContractInstance.VerifyClaim({},{fromBlock: 0, toBlock: 'latest'});

    event.get(function(err,logs){
        var events = [];
            
        if( err ) return handleError(err);
        for( var i = 0 ; i < logs.length ; i++ ){
            var args = logs[i].args;
            var display = new eventDisplay(logs[i].event, args, logs[i].blockNumber);
            
            events.push(display);

            
           //$("#all_deals_table").append('<tr><td>' + text + '</td></tr>');
        }
        
        var eventSubmit = globalContractInstance.SubmitClaim({},{fromBlock: 0, toBlock: 'latest'});
        eventSubmit.get(function(err,logs){
            if( err ) return handleError(err);
            for( var i = 0 ; i < logs.length ; i++ ){
                var args = logs[i].args;
                var display = new eventDisplay(logs[i].event, args, logs[i].blockNumber);
                
                events.push(display);
                
                //var text = display.toText();
                
                //$("#all_deals_table").append('<tr><td>' + text + '</td></tr>');
            }
            
            var sortedEvents = sortEvents(events);
            
            for( var j = 0 ; j < sortedEvents.length ; j++ ) {
                var text = sortedEvents[sortedEvents.length - j - 1].toText();
                $("#all_deals_table").append('<tr><td>' + text + '</td></tr>');                
            }
            
            // finished loading
            $("#all_deals_table").show();
            $("#all_deals_before_load").hide();             
        });
        
    });
};


var allDealsPage = function(){
    $("#all_deals_div").show();    
    $("#all_deals_table").hide();
    $("#all_deals_table_legend").hide();
    makeAllDealsTable();
};


