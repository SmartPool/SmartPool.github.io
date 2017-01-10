pragma solidity ^0.4.0;

import "./zeppelin/Ownable.sol";

contract Lockable is Ownable {
    bool donationLock;

    function Lockable() {
        donationLock = false;
    }

    modifier onlyWhenDonationOpen {
        if (donationLock) throw;
        _;
    }

    function stopAcceptingDonation() onlyOwner {
        if (donationLock) throw;
        donationLock = true;
    }

    function startAcceptingDonation() onlyOwner {
        if (!donationLock) throw;
        donationLock = false;
    }
}


