pragma solidity ^0.4.0;

import "./zeppelin/token/StandardToken.sol";
import "./Lockable.sol";

contract SmartPoolToken is StandardToken, Lockable {
    string public name = "SmartPool";
    string public symbol = "SPT";
    uint public decimals = 1;

    mapping(address => uint) public donationAmountInEther;
    mapping(uint => address) public donors;
    uint public donorCount;
    uint public totalFundRaised;
    uint _supply;
    uint _rate;

    uint ETHER = 1 ether;

    event TokenMint(address newTokenHolder, uint tokensAmount);
    event Donated(address indexed from, uint amount, uint tokensAmount, uint blockNumber);

    function SmartPoolToken(uint preminedTokens) {
        _supply = 0;
        _rate = 100;
        totalFundRaised = 0;
        mintTokens(owner, safeMul(preminedTokens, ETHER / _rate));
    }

    function totalSupply() constant returns (uint supply) {
        return _supply;
    }

    function mintTokens(address newTokenHolder, uint etherAmount) internal returns (uint){
        uint tokensAmount = safeMul(_rate, etherAmount / ETHER);

        if (tokensAmount >= 1) {
            balances[newTokenHolder] = safeAdd(
                balances[newTokenHolder], tokensAmount);
            _supply = safeAdd(_supply, tokensAmount);

            TokenMint(newTokenHolder, tokensAmount);
            return tokensAmount;
        }
        return 0;
    }

    function () payable onlyWhenDonationOpen {
        uint etherAmount = msg.value;
        if (etherAmount <= 0) throw;

        if (donationAmountInEther[msg.sender] == 0) {
            donors[donorCount] = msg.sender;
            donorCount += 1;
        }

        donationAmountInEther[msg.sender] = safeAdd(
            donationAmountInEther[msg.sender], etherAmount);
        totalFundRaised = safeAdd(
            totalFundRaised, etherAmount);
        uint tokensCreated = mintTokens(msg.sender, etherAmount);
        Donated(msg.sender, etherAmount, tokensCreated, block.number);
    }

    function getDonationAmount() constant returns (uint donation) {
        return donationAmountInEther[msg.sender];
    }

    function getTokenBalance() constant returns (uint tokens) {
        return balances[msg.sender];
    }

    function tokenRate() constant returns (uint tokenRate) {
        return _rate;
    }

    function changeRate(uint newRate) onlyOwner returns (bool success) {
        _rate = newRate;
        return true;
    }

    function withdraw() onlyOwner {
        if (!owner.send(this.balance)) {
            throw;
        }
    }
}
