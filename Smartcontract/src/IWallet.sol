// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface ICompanyWallet {
    function executeTransaction(address to, uint256 value, bool isTokenTransfer, address tokenAddress, bytes calldata data) external returns (bool);
    function executeBatchEqual(address token, address[] calldata recipients, uint256 amountPer) external;
    function executeBatchDifferent(address token, address[] calldata recipients, uint256[] calldata amounts) external;
    function getBalance() external view returns (uint256);
    function getTokenBalance(address token) external view returns (uint256);
}