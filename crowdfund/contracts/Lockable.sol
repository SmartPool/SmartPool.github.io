pragma solidity ^0.4.0;

/*
This contract will lock after `duration` blocks since
its creation.
*/
contract Lockable {
    uint public creationBlockNumber;
    uint public duration;

    modifier beforeDuration {
        if (block.number - creationBlockNumber <= duration) {
            _;
        }
    }

    modifier afterDuration {
        if (block.number - creationBlockNumber <= duration) throw;
        _;
    }

    function Lockable(uint _duration) {
        creationBlockNumber = block.number;
        duration = _duration;
    }
}


