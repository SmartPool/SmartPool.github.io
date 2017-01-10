pragma solidity ^0.4.0;

import "./zeppelin/token/StandardToken.sol";
import "./Lockable.sol";

contract SmartPoolToken is StandardToken, Lockable {
    mapping(address => uint) public donationBalances;
    mapping(uint => address) public donors;
    uint public donorCount;
    uint public totalFundRaised;
    uint _supply;
    uint _rate;

    uint ETHER = 1000000000000000000;

    event TokenMint(address newTokenHolder, uint tokensAmount);

    function SmartPoolToken(uint preminedTokens) {
        _supply = 0;
        _rate = 10;
        totalFundRaised = 0;
        mintTokens(owner, safeMul(preminedTokens, ETHER) / _rate);
    }

    function totalSupply() constant returns (uint supply) {
        return _supply;
    }

    function mintTokens(address newTokenHolder, uint etherAmount) internal {
        uint tokensAmount = safeMul(_rate, etherAmount) / ETHER;

        if (tokensAmount >= 1) {
            balances[newTokenHolder] = safeAdd(
                balances[newTokenHolder], tokensAmount);
            _supply += tokensAmount;

            TokenMint(newTokenHolder, tokensAmount);
        }
    }

    function () payable onlyWhenDonationOpen {
        uint etherAmount = msg.value;
        if (etherAmount <= 0) throw;

        if (donationBalances[msg.sender] == 0) {
            donors[donorCount] = msg.sender;
            donorCount += 1;
        }

        donationBalances[msg.sender] = safeAdd(
            donationBalances[msg.sender], etherAmount);
        totalFundRaised = safeAdd(
            totalFundRaised, etherAmount);
        mintTokens(msg.sender, etherAmount);
    }

    function myDonation() constant returns (uint donation) {
        return donationBalances[msg.sender];
    }

    function myToken() constant returns (uint tokens) {
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
