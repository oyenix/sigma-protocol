// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./multisig.sol";

contract MultiSigFactory {
    // ============ STATE ============
    address public factoryOwner;
    address[] public allControllers;
    address[] public allWallets;
    
    mapping(address => bool) public isDeployedController;
    mapping(address => address[]) public userControllers;
    mapping(address => string) public multiSigNames;
    mapping(address => address[]) public signerToControllers;
    mapping(address => address) public controllerToWallet;

    // ============ EVENTS ============
    event MultiSigCreated(address indexed controller, address indexed wallet, address indexed creator, string name);

    // ============ MODIFIERS ============
    modifier onlyOwner() {
        require(msg.sender == factoryOwner, "Not factory owner");
        _;
    }

    modifier onlyController() {
        require(isDeployedController[msg.sender], "Not authorized controller");
        _;
    }

    constructor() {
        factoryOwner = msg.sender;
    }

    // ============ FACTORY FUNCTION ============
    function createMultiSig(
        string calldata _name,
        address[] calldata _initialOwners,
        string[] calldata _initialNames,
        uint256[] calldata _initialPercentages,
        bool[] calldata _initialRemovable,
        uint256 _requiredPercentage,
        uint256 _timelockPeriod,
        uint256 _expiryPeriod,
        uint256 _minOwners
    ) external returns (address controller, address companyWallet) {
        CompanyWallet wallet = new CompanyWallet(address(this));
        
        MultiSigWalletController ctrl = new MultiSigWalletController(
            msg.sender, address(wallet), _name, _initialOwners, _initialNames, 
            _initialPercentages, _initialRemovable, address(this), 
            _requiredPercentage, _timelockPeriod, _expiryPeriod, _minOwners
        );

        // Register Controller
        isDeployedController[address(ctrl)] = true;
        
        // Register Signers
        for (uint256 i = 0; i < _initialOwners.length; i++) {
            signerToControllers[_initialOwners[i]].push(address(ctrl));
        }

        wallet.setController(address(ctrl));
        wallet.transferOwnership(msg.sender);
        
        controller = address(ctrl);
        companyWallet = address(wallet);
        
        allControllers.push(controller);
        allWallets.push(companyWallet);
        userControllers[msg.sender].push(controller);
        multiSigNames[controller] = _name;
        controllerToWallet[controller] = companyWallet;

        emit MultiSigCreated(controller, companyWallet, msg.sender, _name);
    }

    // ============ MAPPING HELPERS ============
    function addSignerMapping(address signer) external onlyController {
        signerToControllers[signer].push(msg.sender);
    }

    function removeSignerMapping(address signer) external onlyController {
        address[] storage controllers = signerToControllers[signer];
        for (uint i = 0; i < controllers.length; i++) {
            if (controllers[i] == msg.sender) {
                controllers[i] = controllers[controllers.length - 1];
                controllers.pop();
                break;
            }
        }
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Struct to return detailed multisig info in a single call
     */
    struct MultiSigData {
        string name;
        address controller;
        address wallet;
        uint256 ownerCount;
        uint256 requiredPercentage;
        uint256 minOwners;
        uint256 balance;
        bool isPaused;
    }

    /**
     * @dev Returns consolidated data for a specific multisig controller
     * Requires the MultiSigWalletController to have public getters for:
     * - requiredPercentage()
     * - minOwners()
     * - paused()
     * - getOwners() or owners array
     */
    function getMultiSigInfo(address _controller) external view returns (MultiSigData memory) {
        require(isDeployedController[_controller], "Controller not found");

        // 1. Get basic info stored in Factory
        string memory _name = multiSigNames[_controller];
        address _wallet = controllerToWallet[_controller];

        // 2. Instantiate the Controller
        MultiSigWalletController ctrl = MultiSigWalletController(payable(_controller));

        // 3. FIX: Destructure the tuple to get the owners array first
        (address[] memory _owners, , , ) = ctrl.getOwners();
        
        uint256 _ownerCount = _owners.length;
        uint256 _reqPct = ctrl.requiredPercentage();
        uint256 _minOwn = ctrl.minOwners();
        bool _paused = ctrl.paused();

        // 4. Return formatted struct
        return MultiSigData({
            name: _name,
            controller: _controller,
            wallet: _wallet,
            ownerCount: _ownerCount,
            requiredPercentage: _reqPct,
            minOwners: _minOwn,
            balance: _wallet.balance, // This gets the factory's balance, assuming you want the WALLET'S balance:
            // balance: _wallet.balance, // This is correct if _wallet is an address
            isPaused: _paused
        });
    }
    function getDeploymentCount() external view returns (uint256) {
        return allControllers.length;
    }

    function getAllControllers() external view returns (address[] memory) {
        return allControllers;
    }

    function getControllersBySigner(address _signer) external view returns (address[] memory) {
        return signerToControllers[_signer];
    }

    
    // ============ EMERGENCY RESCUE ============
    function rescueETH(uint256 amount) external onlyOwner {
        payable(factoryOwner).transfer(amount);
    }

    receive() external payable {}
}