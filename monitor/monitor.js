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
var contractAddress = "0x893DC419776635F8FD1b1fa9934BF529aeF25607";
var contractABI = [{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"owners","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"newVersionReleased","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"getPoolETHBalance","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"uncleRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"creationBlockNumber","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"sender","type":"address"}],"name":"debugGetNumPendingSubmissions","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"sender","type":"address"}],"name":"canRegister","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"poolFees","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"paymentAddress","type":"address"}],"name":"register","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_uncleRate","type":"uint256"},{"name":"_poolFees","type":"uint256"}],"name":"setUnlceRateAndFees","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"sender","type":"address"}],"name":"getAverageDifficulty","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"version","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"debugResetSubmissions","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"sender","type":"address"},{"name":"seed","type":"uint256"}],"name":"calculateSubmissionIndex","outputs":[{"name":"","type":"uint256[2]"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"sender","type":"address"}],"name":"getClaimSeed","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"rootHash","type":"uint256"},{"name":"rootMin","type":"uint256"},{"name":"rootMax","type":"uint256"},{"name":"leafHash","type":"uint256"},{"name":"leafCounter","type":"uint256"},{"name":"branchIndex","type":"uint256"},{"name":"countersBranch","type":"uint256[]"},{"name":"hashesBranch","type":"uint256[]"}],"name":"verifyAgtDebugForTesting","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"ethashContract","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"sender","type":"address"}],"name":"getShareIndexDebugForTestRPC","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"sender","type":"address"},{"name":"seed","type":"uint256"},{"name":"submissionNumber","type":"uint256"},{"name":"shareIndex","type":"uint256"}],"name":"verifySubmissionIndex","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"miner","type":"address"},{"name":"add","type":"bool"}],"name":"updateWhiteList","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"rlpHeader","type":"bytes"},{"name":"nonce","type":"uint256"},{"name":"submissionIndex","type":"uint256"},{"name":"shareIndex","type":"uint256"},{"name":"dataSetLookup","type":"uint256[]"},{"name":"witnessForLookup","type":"uint256[]"},{"name":"augCountersBranch","type":"uint256[]"},{"name":"augHashesBranch","type":"uint256[]"}],"name":"verifyClaim","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"sender","type":"address"}],"name":"isRegistered","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"numShares","type":"uint256"},{"name":"difficulty","type":"uint256"},{"name":"min","type":"uint256"},{"name":"max","type":"uint256"},{"name":"augRoot","type":"uint256"},{"name":"lastClaimBeforeVerification","type":"bool"}],"name":"submitClaim","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"sender","type":"address"}],"name":"getMinerId","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"whiteListEnabled","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"declareNewerVersion","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"existingIds","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"id","type":"uint256"},{"name":"numChars","type":"uint256"}],"name":"to62Encoding","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"inputs":[{"name":"_owners","type":"address[3]"},{"name":"_ethashContract","type":"address"},{"name":"_whiteListEnabeled","type":"bool"}],"payable":true,"type":"constructor"},{"payable":true,"type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"miner","type":"address"},{"indexed":false,"name":"time","type":"uint256"},{"indexed":false,"name":"numShares","type":"uint256"},{"indexed":false,"name":"difficulty","type":"uint256"}],"name":"ValidShares","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":false,"name":"error","type":"uint256"},{"indexed":false,"name":"errorInfo","type":"uint256"}],"name":"Register","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"miner","type":"address"},{"indexed":false,"name":"error","type":"uint256"},{"indexed":false,"name":"errorInfo","type":"uint256"},{"indexed":false,"name":"add","type":"bool"}],"name":"UpdateWhiteList","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":false,"name":"error","type":"uint256"},{"indexed":false,"name":"errorInfo","type":"uint256"}],"name":"VerifyExtraData","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":false,"name":"error","type":"uint256"},{"indexed":false,"name":"errorInfo","type":"uint256"}],"name":"VerifyClaim","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"sender","type":"address"},{"indexed":false,"name":"amountInWei","type":"uint256"}],"name":"IncomingFunds","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":false,"name":"error","type":"uint256"},{"indexed":false,"name":"errorInfo","type":"uint256"}],"name":"SetUnlceRateAndFees","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"index","type":"uint256"}],"name":"GetShareIndexDebugForTestRPCSubmissionIndex","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"index","type":"uint256"}],"name":"GetShareIndexDebugForTestRPCShareIndex","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":false,"name":"error","type":"uint256"},{"indexed":false,"name":"errorInfo","type":"uint256"}],"name":"SubmitClaim","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":false,"name":"error","type":"uint256"},{"indexed":false,"name":"errorInfo","type":"uint256"}],"name":"DebugResetSubmissions","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"error","type":"uint256"},{"indexed":false,"name":"index","type":"uint256"}],"name":"VerifyAgt","type":"event"}];

var globalEthashInstance;
var ethashABI = [{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"owners","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"header","type":"bytes32"},{"name":"nonceLe","type":"bytes8"},{"name":"dataSetLookup","type":"uint256[]"},{"name":"witnessForLookup","type":"uint256[]"},{"name":"epochIndex","type":"uint256"}],"name":"hashimoto","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"epochIndex","type":"uint256"},{"name":"nodeIndex","type":"uint256"}],"name":"getEpochData","outputs":[{"name":"","type":"uint256[3]"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"epochIndex","type":"uint256"}],"name":"isEpochDataSet","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"epoch","type":"uint256"},{"name":"fullSizeIn128Resultion","type":"uint256"},{"name":"branchDepth","type":"uint256"},{"name":"merkleNodes","type":"uint256[]"},{"name":"start","type":"uint256"},{"name":"numElems","type":"uint256"}],"name":"setEpochData","outputs":[],"payable":false,"type":"function"},{"inputs":[{"name":"_owners","type":"address[3]"}],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":false,"name":"error","type":"uint256"},{"indexed":false,"name":"errorInfo","type":"uint256"}],"name":"SetEpochData","type":"event"}];
var ethashAddress = "0xdf4bA5f238e204346aCB3a62f41f3A2d16055f69";

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

    var ethashContractABI = web3.eth.contract(ethashABI);
    globalEthashInstance = ethashContractABI.at(ethashAddress);

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
    
    this.work = 0;
    if( this.eventType === "SubmitClaim" ) {
        if( toInt(this.error) === 0 ) {
            this.work = toInt(this.errorInfo); 
        }
    }
    
    var findPrevSubmitClaimBlockNumber = function( events, blockNumber, sender ) {
        var resultBlockNumber = null;
        for( var i = 0 ; i < events.length ; i++ ) {
            if( events[i].eventType === "SubmitClaim" ) {
                if( toInt( events[i].blockNumber ) < toInt( blockNumber ) ) {
                    if( events[i].sender == sender ) {
                        resultBlockNumber = events[i].blockNumber;
                    }
                }
            }
        }
        
        return resultBlockNumber;
    };
    
    this.toText = function() {
        var eventUIName = this.eventType;
        if (this.eventType === "VerifyClaim" ) eventUIName = "Verify";
        if (this.eventType === "SubmitClaim" ) eventUIName = "Submit";
        
        
        var string = this.blockNumber.toString(10) + "   " +  
        eventUIName + " : " + addressToName(this.sender.toString(16)) + " ";
        if( toInt(this.error) === 0 ) string += "OK";
        else string += "ERROR!!! " + "0x" + this.error.toString(16) + " " + "0x" + this.errorInfo.toString(16);
        
        /*
        if( this.eventType === "VerifyClaim" ) {
            string += " hash rate " + getHashRate( this.sender, this.blockNumber ); 
        }*/
        
        return string;
    };
    
    this.addHashRate = function( id, prefix, events ) {
        var mysender = this.sender;
        var mywork = this.work;
        var myblockNumber = this.blockNumber;    
        var currentTimeStamp;
        globalWeb3.eth.getBlock( myblockNumber, function(err,result){
            if( err ) return handleError(err);
            currentTimeStamp = toInt(result.timestamp);
            var prevBlockNumber = findPrevSubmitClaimBlockNumber(events, myblockNumber, mysender);
            if( prevBlockNumber === null ) return;
            globalWeb3.eth.getBlock( prevBlockNumber, function(err,result){
                if( err ) return handleError(err);
                var prevTimeStamp = toInt(result.timestamp);
                
                var timeDiff = currentTimeStamp - prevTimeStamp;
                var rate = parseInt((mywork/timeDiff) / (1000 * 1000));
                
                $("#" + id).text(prefix + " " + rate.toString() + " MHs");
            });            
        }); 
        
    };
}

function validSharesStats( args, blockNumber ) {
    var toInt = function(bigNumber){
        return parseInt(bigNumber.toString());  
    };
 
    this.sender = args.miner;
    this.timestamp = args.time;
    this.numShares = args.numShares;
    this.difficulty = args.difficulty;
    this.blockNumber = blockNumber;
        
    this.computeHashRate = function( sortedValidSharesEvents ) {
        var eventIndex = -1;
        for( var i = 0 ; i < sortedValidSharesEvents.length ; i++ ) {
            if( sortedValidSharesEvents[i].sender.toString(16) == this.sender.toString(16)) {
                if( sortedValidSharesEvents[i].timestamp.toString(16) == this.timestamp.toString(16) ) {
                    eventIndex = i;
                    break;                     
                }
            }
        }
        
        if( i < 0 ) alret( "event was not found" );
        
        // find next event
        var prevIndex = -1;
        for( var j = 0 ; j < eventIndex ; j++ ) {
            if( sortedValidSharesEvents[j].sender.toString(16) == this.sender.toString(16)) {
                prevIndex = j;
            }            
        }
        
        if( prevIndex < 0 ) return 0; // first event - cannot compute rate
        var prevEvent = sortedValidSharesEvents[prevIndex]; 
        var timediff = toInt(this.timestamp.minus(prevEvent.timestamp));

        var work = toInt(this.numShares) * toInt(this.difficulty);        

        var rate = parseInt((work/timediff) / (1000 * 1000));

        return rate.toString() + " MHs";        
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


var validSharesEvents = [];

var getHashRate = function( sender, blockNumber ) {
    var found = false;
    for( var i = 0 ; i < validSharesEvents.length ; i++ ) {
        event = validSharesEvents[i];
        if( event.sender.toString(16) == sender.toString(16) &&
            event.blockNumber.toString(16) == blockNumber.toString(16) ) {
                found = true;
                break;
            }
    }
    
    if( ! found ) console.log("didn't find event" );
    
    return event.computeHashRate(validSharesEvents);
    
};


var makeAllDealsTable = function(){
    var workEvent = globalContractInstance.ValidShares({},{fromBlock: 0, toBlock: 'latest'});
    workEvent.get(function(err,logs){
        if( err ) return handleError(err);
        for( var i = 0 ; i < logs.length ; i++ ){
            validSharesEvents.push( new validSharesStats(logs[i].args,logs[i].blockNumber));
        }
    
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
                    var singleEvent = sortedEvents[sortedEvents.length - j - 1]; 
                    var text = singleEvent.toText();
                    var id = "event_id_" + j.toString();
                    $("#all_deals_table").append('<tr><td id="'+id +'">' + text + '</td></tr>');
                    
                    if( singleEvent.eventType === "SubmitClaim" ) {
                        singleEvent.addHashRate( id, text, sortedEvents );
                    }
                }
                
                // finished loading
                $("#all_deals_table").show();
                $("#all_deals_before_load").hide();             
            });
            
        });
    });
};


var allDealsPage = function(){
    $("#all_deals_div").show();    
    $("#all_deals_table").hide();
    $("#all_deals_table_legend").hide();
    makeAllDealsTable();
    getEpochData();
};

var addressToName = function( address ) {
    if( address === "0xf214dde57f32f3f34492ba3148641693058d4a9e" ) return "smartpool";
    if( address === "0x0050521acb69611f5cb00618a60c64aedb1161ba" ) return "Vu";
    if( address === "0xf5a85a883686ce67f77a1a9db54cc13954349a7c" ) return "Aurel";
    if( address === "0x00b6d7d86c0f086929abe4730b581af92b0f6ab6" ) return "John";    
    
    return address;
};


var currentBlockNumber;

var findMaxSetEpoch = function( epochInd ) {
    globalEthashInstance.isEpochDataSet( new BigNumber(epochInd.toString()), function(err,result){
        if( err ) return handleError(err);
        if( result ) findMaxSetEpoch( epochInd+1);
        else {
            var firstUnsetBlock = epochInd * 30000
            var numBlocksLeft = firstUnsetBlock - currentBlockNumber;
            $("#epoch_data_label").html( "epoch data is set for the next " + numBlocksLeft.toString() + " blocks");             
        }
        
    });  
    
};

var getEpochData = function() {
     globalWeb3.eth.getBlock("latest",function(err,result){
          if( err ) return handleError(err);
          currentBlockNumber = parseInt(result.number.toString(10));
          var epoch = parseInt(currentBlockNumber / 30000);
          findMaxSetEpoch( epoch );
          
     });    
};