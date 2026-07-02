// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IMultiSigFactory {
    function addSignerMapping(address signer) external;
    function removeSignerMapping(address signer) external;
}