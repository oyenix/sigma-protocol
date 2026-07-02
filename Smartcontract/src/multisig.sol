// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./IWallet.sol";
import "./Ifactory.sol";
import "../lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MultiSigWalletController is ReentrancyGuard {
    struct Owner {
        string ownerName;
        uint256 percentage;
        bool exists;
        bool removable;
    }

    struct TransactionRecord {
        address initiator;
        address to;
        uint256 value;
        bytes data;
        bool isTokenTransfer;
        address tokenAddress;
        bool executed;
        mapping(address => bool) confirmations;
        uint256 confirmationCount;
        uint256 timestamp;
        uint256 timelockEnd;
    }

    address public immutable factory;
    address constant ETH_ADDRESS = address(0);
    string public name;
    mapping(address => Owner) public owners;
    address[] public ownerList;
    uint256 public totalPercentage;
    uint256 public requiredPercentage;
    uint256 public timelockPeriod;
    uint256 public expiryPeriod;
    uint256 public minOwners;

    address public immutable deployer;
    ICompanyWallet public immutable companyWallet;

    bool public paused;
    TransactionRecord[] public transactions;

    // ============ EVENTS ============
    event MultiSigNameChanged(string oldName, string newName);
    event OwnerAdded(address indexed owner, string ownerName, uint256 percentage);
    event OwnerRemoved(address indexed owner, uint256 returnedPercentage);
    event OwnerPercentageChanged(address indexed owner, uint256 oldPct, uint256 newPct);
    event RequiredPercentageChanged(uint256 oldVal, uint256 newVal);
    event TimelockPeriodChanged(uint256 oldVal, uint256 newVal);
    event ExpiryPeriodChanged(uint256 oldVal, uint256 newVal);
    event MinOwnersChanged(uint256 oldVal, uint256 newVal);
    event TransactionSubmitted(uint256 indexed txId, address initiator, address to, uint256 value, bool isToken);
    event TransactionConfirmed(uint256 indexed txId, address owner, uint256 percentage);
    event TransactionExecuted(uint256 indexed txId);
    event TransactionRevoked(uint256 indexed txId, address owner);
    event BatchTransferExecuted(uint256 indexed txId, uint256 successful, uint256 totalSent);
    event ContractPaused();
    event ContractUnpaused();
    event TransferFailed(address indexed recipient, uint256 amount);

    modifier onlyOwner() {
        require(owners[msg.sender].exists, "Not owner");
        _;
    }
    modifier onlyDeployer() { require(msg.sender == deployer, "Only deployer"); _; }
    modifier whenNotPaused() { require(!paused, "Paused"); _; }
    modifier validPercentage(uint256 p) { require(p > 0 && p <= 100, "Invalid %"); _; }
    modifier notExpired(uint256 txId) {
        require(txId < transactions.length, "Invalid tx");
        require(block.timestamp <= transactions[txId].timestamp + expiryPeriod, "Expired");
        _;
    }

    constructor(
        address _creator,
        address _companyWallet,
        string memory _name,
        address[] memory _initialOwners,
        string[] memory _initialNames,
        uint256[] memory _initialPercentages,
        bool[] memory _initialRemovable,
        address _factory,
        uint256 _requiredPercentage,
        uint256 _timelockPeriod,
        uint256 _expiryPeriod,
        uint256 _minOwners
    ) {
        deployer = _creator; 
        companyWallet = ICompanyWallet(_companyWallet);
        factory = _factory;
        name = _name;
        requiredPercentage = _requiredPercentage;
        timelockPeriod = _timelockPeriod;
        expiryPeriod = _expiryPeriod;
        minOwners = _minOwners;

        for (uint256 i = 0; i < _initialOwners.length; i++) {
            address ownerAddr = _initialOwners[i];
            require(ownerAddr != address(0) && ownerAddr != _creator, "Creator cannot be owner");
            
            owners[ownerAddr] = Owner(_initialNames[i], _initialPercentages[i], true, _initialRemovable[i]);
            ownerList.push(ownerAddr);
            totalPercentage += _initialPercentages[i];
            
            // NOTE: Factory mapping is handled by the factory itself during createMultiSig
            
            emit OwnerAdded(ownerAddr, _initialNames[i], _initialPercentages[i]);
        }
        require(totalPercentage <= 100, "Total > 100");
    }

    // ============ PUBLIC SUBMIT FUNCTION (ADDED) ============
    /**
     * @dev Allows owners to submit any transaction (ETH transfer, Token transfer, or Contract interaction).
     * This fixes the "contract.submitTransaction is not a function" error.
     */
    function submitTransaction(
        address to, 
        uint256 value, 
        bool isToken, 
        address tokenAddr, 
        bytes memory data
    ) external onlyOwner whenNotPaused returns (uint256) {
        return _submit(to, value, isToken, tokenAddr, data);
    }

    // ============ BATCH TRANSFER: EQUAL AMOUNTS ============
    function submitBatchTransferEqual(address token, address[] calldata recipients, uint256 amountPer) external onlyOwner returns (uint256) {
        bytes memory data = abi.encodeWithSelector(ICompanyWallet.executeBatchEqual.selector, token, recipients, amountPer);
        return _submit(address(companyWallet), 0, false, address(0), data);
    }

    // ============ BATCH TRANSFER: DIFFERENT AMOUNTS ============
    function submitBatchTransferDifferent(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external payable onlyOwner whenNotPaused returns (uint256 txId) {
        require(recipients.length == amounts.length, "Mismatch");
        require(recipients.length > 0, "Empty");

        // Encode the call for the WALLET'S batch function
        bytes memory data = abi.encodeWithSelector(
            ICompanyWallet.executeBatchDifferent.selector,
            token, 
            recipients, 
            amounts
        );

        return _submit(address(companyWallet), 0, false, address(0), data);
    }

    // ============ CORE MULTISIG LOGIC ============
    function _submit(
        address to, uint256 value, bool isToken, address tokenAddr, bytes memory data
    ) internal returns (uint256 txId) {
        txId = transactions.length;
        transactions.push();
        TransactionRecord storage txn = transactions[txId];

        txn.initiator = msg.sender;
        txn.to = to;
        txn.value = value;
        txn.data = data;
        txn.isTokenTransfer = isToken;
        txn.tokenAddress = tokenAddr;
        txn.executed = false;
        txn.timestamp = block.timestamp;
        
        // Auto-confirm for the initiator
        txn.confirmations[msg.sender] = true;
        txn.confirmationCount = owners[msg.sender].percentage;

        emit TransactionSubmitted(txId, msg.sender, to, value, isToken);

        // Check if it passes immediately
        if (isConfirmed(txId)) {
            txn.timelockEnd = block.timestamp + timelockPeriod;
            if (timelockPeriod == 0) _execute(txId);
        }
    }

    function confirmTransaction(uint256 txId)
        external onlyOwner whenNotPaused notExpired(txId) nonReentrant {
        TransactionRecord storage txn = transactions[txId];
        require(!txn.executed, "Executed");
        require(!txn.confirmations[msg.sender], "Confirmed");
        
        txn.confirmations[msg.sender] = true;
        txn.confirmationCount += owners[msg.sender].percentage;
        
        emit TransactionConfirmed(txId, msg.sender, owners[msg.sender].percentage);
        
        if (isConfirmed(txId) && txn.timelockEnd == 0) {
            txn.timelockEnd = block.timestamp + timelockPeriod;
            if (timelockPeriod == 0) _execute(txId);
        }
    }

    function executeTransactionManual(uint256 txId)
        external onlyOwner whenNotPaused notExpired(txId) nonReentrant {
        TransactionRecord storage txn = transactions[txId];
        require(!txn.executed, "Executed");
        require(isConfirmed(txId), "Not confirmed");
        require(block.timestamp >= txn.timelockEnd, "Timelock");
        _execute(txId);
    }

    function _execute(uint256 txId) internal {
        TransactionRecord storage txn = transactions[txId];
        require(!txn.executed, "Already executed");
        txn.executed = true;

        bool success;
        if (txn.to == address(this)) {
            // Internal governance logic
            (success, ) = txn.to.call{value: txn.value}(txn.data);
        } else {
            // External execution via CompanyWallet
            success = companyWallet.executeTransaction(
                txn.to,
                txn.value,
                txn.isTokenTransfer,
                txn.tokenAddress,
                txn.data
            );
        }
        
        require(success, "Execution failed");
        emit TransactionExecuted(txId);
    }

    function isConfirmed(uint256 txId) public view returns (bool) {
        return transactions[txId].confirmationCount >= requiredPercentage;
    }

    // ============ NAME MANAGEMENT ============
    function changeNameInternal(string calldata newName) external whenNotPaused {
        require(msg.sender == address(this), "Only self");
        require(bytes(newName).length > 0, "Empty name");
        emit MultiSigNameChanged(name, newName);
        name = newName;
    }

    function submitChangeName(string calldata newName) external onlyOwner returns (uint256) {
        return _submit(address(this), 0, false, address(0),
            abi.encodeWithSelector(this.changeNameInternal.selector, newName));
    }

    // Add this inside MultiSigWalletController contract

    function confirmTransactionsBatch(uint256[] calldata txIds) external onlyOwner whenNotPaused {
        for (uint256 i = 0; i < txIds.length; i++) {
            uint256 txId = txIds[i];
            
            // 1. Validation (Matches modifiers)
            require(txId < transactions.length, "Invalid tx");
            // Check expiry manually since we can't use the modifier in a loop easily
            require(block.timestamp <= transactions[txId].timestamp + expiryPeriod, "Expired");
            
            TransactionRecord storage txn = transactions[txId];
            require(!txn.executed, "Executed");
            
            // Skip if already confirmed (prevents revert causing entire batch to fail)
            if (txn.confirmations[msg.sender]) continue;

            // 2. State Changes
            txn.confirmations[msg.sender] = true;
            txn.confirmationCount += owners[msg.sender].percentage;

            emit TransactionConfirmed(txId, msg.sender, owners[msg.sender].percentage);

            // 3. Execution Check
            if (isConfirmed(txId) && txn.timelockEnd == 0) {
                txn.timelockEnd = block.timestamp + timelockPeriod;
                if (timelockPeriod == 0) _execute(txId);
            }
        }
    }
    
    // ============ ADMIN FUNCTIONS (via proposal) ============
    function changeRequiredPercentageInternal(uint256 v) external whenNotPaused validPercentage(v) {
        require(msg.sender == address(this), "Only self");
        emit RequiredPercentageChanged(requiredPercentage, v);
        requiredPercentage = v;
    }

    function changeTimelockPeriodInternal(uint256 v) external whenNotPaused {
        require(msg.sender == address(this), "Only self");
        emit TimelockPeriodChanged(timelockPeriod, v);
        timelockPeriod = v;
    }

    function changeExpiryPeriodInternal(uint256 v) external whenNotPaused {
        require(v > 0, "expiry > 0");
        require(msg.sender == address(this), "Only self");
        emit ExpiryPeriodChanged(expiryPeriod, v);
        expiryPeriod = v;
    }

    function changeMinOwnersInternal(uint256 v) external whenNotPaused {
        require(v >= 2, "min >= 2");
        require(msg.sender == address(this), "Only self");
        emit MinOwnersChanged(minOwners, v);
        minOwners = v;
    }

    // ============ PROPOSAL STARTERS ============
    function submitChangeRequiredPct(uint256 v) external onlyOwner returns (uint256) {
        return _submit(address(this), 0, false, address(0),
            abi.encodeWithSelector(this.changeRequiredPercentageInternal.selector, v));
    }

    function submitChangeTimelock(uint256 v) external onlyOwner returns (uint256) {
        return _submit(address(this), 0, false, address(0),
            abi.encodeWithSelector(this.changeTimelockPeriodInternal.selector, v));
    }

    function submitChangeExpiry(uint256 v) external onlyOwner returns (uint256) {
        return _submit(address(this), 0, false, address(0),
            abi.encodeWithSelector(this.changeExpiryPeriodInternal.selector, v));
    }

    function submitChangeMinOwners(uint256 v) external onlyOwner returns (uint256) {
        return _submit(address(this), 0, false, address(0),
            abi.encodeWithSelector(this.changeMinOwnersInternal.selector, v));
    }

    // ============ OWNER MANAGEMENT ============
    function _addOwnerInternal(address addr, string memory ownerName, uint256 pct, bool removable) internal {
        require(!owners[addr].exists, "Exists");
        require(totalPercentage + pct <= 100, "Sum > 100");
        
        owners[addr] = Owner(ownerName, pct, true, removable);
        ownerList.push(addr);
        totalPercentage += pct;

        // Update Factory Index
        IMultiSigFactory(factory).addSignerMapping(addr);
        
        emit OwnerAdded(addr, ownerName, pct);
    }

    function removeOwnerInternal(address addr) external whenNotPaused {
        require(msg.sender == address(this), "Only self");
        require(owners[addr].exists, "Not owner");
        require(owners[addr].removable, "Not removable");
        require(ownerList.length - 1 >= minOwners, "Too few owners");

        uint256 pct = owners[addr].percentage;
        totalPercentage -= pct;
        delete owners[addr];

        for (uint256 i = 0; i < ownerList.length; i++) {
            if (ownerList[i] == addr) {
                ownerList[i] = ownerList[ownerList.length - 1];
                ownerList.pop();
                break;
            }
        }

        // Update Factory Index
        IMultiSigFactory(factory).removeSignerMapping(addr);

        emit OwnerRemoved(addr, pct);
    }

    function addOwnerInternal(address newOwner, string calldata ownerName, uint256 percentage, bool removable)
        external whenNotPaused {
        require(msg.sender == address(this), "Only self");
        _addOwnerInternal(newOwner, ownerName, percentage, removable);
    }

    function submitAddOwner(address newOwner, string calldata ownerName, uint256 pct, bool removable)
        external onlyOwner returns (uint256) {
        return _submit(address(this), 0, false, address(0),
            abi.encodeWithSelector(this.addOwnerInternal.selector, newOwner, ownerName, pct, removable));
    }

    // ============ VIEW FUNCTIONS ============
    function getOwners()
        external view returns (
            address[] memory addrs,
            string[] memory ownerNames,
            uint256[] memory percentages,
            bool[] memory removable
        ) {
        uint256 len = ownerList.length;
        addrs = new address[](len);
        ownerNames = new string[](len);
        percentages = new uint256[](len);
        removable = new bool[](len);
        for (uint256 i = 0; i < len; i++) {
            address a = ownerList[i];
            Owner memory o = owners[a];
            addrs[i] = a;
            ownerNames[i] = o.ownerName;
            percentages[i] = o.percentage;
            removable[i] = o.removable;
        }
    }
    
    // Helper to get transaction count
    function getTransactionCount() external view returns (uint256) {
        return transactions.length;
    }

    // ============ EMERGENCY ============
    function pause() external onlyDeployer { paused = true; emit ContractPaused(); }
    function unpause() external onlyDeployer { paused = false; emit ContractUnpaused(); }

    receive() external payable {}
}