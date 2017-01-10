pragma solidity ^0.4.0;

import "./zeppelin/Ownable.sol";

/*
This contract will lock after `duration` blocks since
its creation.
*/
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


