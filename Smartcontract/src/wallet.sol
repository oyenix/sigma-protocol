// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./IWallet.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "../lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

contract CompanyWallet is ICompanyWallet, ReentrancyGuard {
    address public owner;
    address public controller;

    event ControllerChanged(address indexed oldController, address indexed newController);
    event TransactionExecuted(address indexed to, uint256 value, bool isTokenTransfer, address tokenAddress, bool success);
    event BatchTransferExecuted(uint256 successful, uint256 totalSent);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyController() {
        require(msg.sender == controller, "Only controller");
        _;
    }
     
     modifier onlyControllerOrSelf() {
        require(msg.sender == controller || msg.sender == address(this), "Auth failed");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address initialOwner) {
        require(initialOwner != address(0), "Invalid owner");
        owner = initialOwner;
    }

    function setController(address _controller) external onlyOwner {
        require(controller == address(0), "Already set");
        require(_controller != address(0), "Invalid controller");
        controller = _controller;
        emit ControllerChanged(address(0), _controller);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

   function executeTransaction(
        address to,
        uint256 value,
        bool isTokenTransfer,
        address tokenAddress,
        bytes calldata data
    ) external override onlyController nonReentrant returns (bool) {
        require(to != address(0), "Invalid recipient");
        bool success;

        if (isTokenTransfer) {
            success = IERC20(tokenAddress).transfer(to, value);
        } else {
            // This low-level call changes msg.sender to address(this)
            (success, ) = to.call{value: value}(data);
        }

        emit TransactionExecuted(to, value, isTokenTransfer, tokenAddress, success);
        return success;
    }

    function executeBatchEqual(address token, address[] calldata recipients, uint256 amountPer) 
        external 
        onlyControllerOrSelf 
    {
        uint256 successCount = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) continue;
            bool sent;
            if (token == address(0)) {
                (sent, ) = payable(recipients[i]).call{value: amountPer}("");
            } else {
                sent = IERC20(token).transfer(recipients[i], amountPer);
            }
            if (sent) successCount++;
        }
        emit BatchTransferExecuted(successCount, successCount * amountPer);
    }

    function executeBatchDifferent(address token, address[] calldata recipients, uint256[] calldata amounts) 
        external 
        onlyControllerOrSelf 
    {
        uint256 totalSent = 0;
        uint256 successCount = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) continue;
            bool sent;
            if (token == address(0)) {
                (sent, ) = payable(recipients[i]).call{value: amounts[i]}("");
            } else {
                sent = IERC20(token).transfer(recipients[i], amounts[i]);
            }
            if (sent) {
                successCount++;
                totalSent += amounts[i];
            }
        }
        emit BatchTransferExecuted(successCount, totalSent);
    }

    function getBalance() external view override returns (uint256) { return address(this).balance; }
    function getTokenBalance(address token) external view override returns (uint256) { return IERC20(token).balanceOf(address(this)); }

    receive() external payable {}
    fallback() external payable {}
}