pragma solidity ^0.4.0;

import "./ERC20.sol";
import "./Lockable.sol";

contract SmartPoolToken is ERC20, Lockable {
    address public theTeam;
    mapping(address => uint) public _tokenBalances;
    mapping(address => uint) public _donationBalances;
    mapping(uint => address) public _donors;
    uint public donorCount;
    uint public totalFundRaised;
    mapping(address => mapping(address => uint)) _approvals;
    uint _supply;
    uint public rate;
    bool donationLock;

    event TokenMint(address newTokenHolder, uint tokensAmount);

    modifier teamRestricted {
        if (msg.sender != theTeam) throw;
        _;
    }

    modifier donationGuard {
        if (donationLock) throw;
        _;
    }

    function SmartPoolToken(uint _rate, uint _duration) Lockable(_duration) {
        _supply = 0;
        rate = _rate;
        totalFundRaised = 0;
        donationLock = false;
        theTeam = msg.sender;
    }

    function totalSupply() constant returns (uint supply) {
        return _supply;
    }

    function balanceOf( address who ) constant returns (uint value) {
        return _tokenBalances[who];
    }

    function allowance(address owner, address spender) constant returns (uint _allowance) {
        return _approvals[owner][spender];
    }

    // A helper to notify if overflow occurs
    function safeToAdd(uint a, uint b) internal returns (bool) {
        return (a + b >= a && a + b >= b);
    }

    function transfer(address to, uint value) returns (bool ok) {
        if (_tokenBalances[msg.sender] < value) throw;
        if (!safeToAdd(_tokenBalances[to], value)) throw;

        _tokenBalances[msg.sender] -= value;
        _tokenBalances[to] += value;
        Transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint value)
        returns (bool ok) {
        if (_tokenBalances[from] < value) throw;
        if (_approvals[from][msg.sender] < value) throw;
        if (!safeToAdd(_tokenBalances[to], value)) throw;

        _approvals[from][msg.sender] -= value;
        _tokenBalances[from] -= value;
        _tokenBalances[to] += value;
        Transfer(from, to, value);
        return true;
    }

    function approve(address spender, uint value) returns (bool ok) {
        _approvals[msg.sender][spender] = value;
        Approval(msg.sender, spender, value);
        return true;
    }

    function mintTokens(address newTokenHolder, uint etherAmount)
        internal beforeDuration {
        uint tokensAmount = rate * etherAmount;
        if (!safeToAdd(_tokenBalances[newTokenHolder], tokensAmount)) throw;
        if (!safeToAdd(_supply, tokensAmount)) throw;

        _tokenBalances[newTokenHolder] += tokensAmount;
        _supply += tokensAmount;

        TokenMint(newTokenHolder, tokensAmount);
    }

    function () payable donationGuard {
        uint etherAmount = msg.value;
        if (etherAmount <= 0) throw;

        if (_donationBalances[msg.sender] == 0) {
            _donors[donorCount] = msg.sender;
            donorCount += 1;
        }
        if (!safeToAdd(_donationBalances[msg.sender], etherAmount)) throw;
        _donationBalances[msg.sender] += etherAmount;
        totalFundRaised += etherAmount;
        mintTokens(msg.sender, etherAmount);
    }

    function myDonation() constant returns (uint donation) {
        return _donationBalances[msg.sender];
    }

    function myToken() constant returns (uint tokens) {
        return _tokenBalances[msg.sender];
    }

    function turnOffDonation() teamRestricted afterDuration {
        donationLock = true;
    }

    function turnOnDonation() teamRestricted afterDuration {
        donationLock = false;
    }

    function withdraw() teamRestricted afterDuration {
        if (!theTeam.send(this.balance)) {
            throw;
        }
    }
}
