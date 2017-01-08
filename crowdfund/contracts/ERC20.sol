pragma solidity ^0.4.0;

/*
SmartPool token contract which is based on the ERC20 token contract.
*/

/*
Discussion: ERC20 allows token holders to approve someone else to
spend theirs tokens. Which is not the case for SmartPool yet.
Should we keep that ability or just drop it out?
*/
contract ERC20 {
    function totalSupply() constant returns (uint);
    function balanceOf(address who) constant returns (uint);
    function allowance(address owner, address spender) constant returns (uint);

    function transfer(address to, uint value) returns (bool ok);
    function transferFrom(address from, address to, uint value) returns (bool ok);
    function approve(address spender, uint value) returns (bool ok);

    event Transfer(address indexed from, address indexed to, uint value);
    event Approval(address indexed owner, address indexed spender, uint value);
}


