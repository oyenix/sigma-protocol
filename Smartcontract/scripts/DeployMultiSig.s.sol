// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/MultisigFactory.sol";
import "../src/wallet.sol";

/**
 * DeployMultiSig — Botchain-only deployment.
 *
 * Besides deploying the factory, this also calls createMultiSig() ONCE to
 * seed a real CompanyWallet + MultiSigWalletController pair on-chain. This
 * isn't a "real" multisig you'll use — its only purpose is to give the
 * explorer one verified instance of each child contract's exact creation
 * code + compiler settings, so it can bytecode-match every FUTURE
 * createMultiSig() call automatically (Blockscout-style explorers do this
 * natively — see the verify step below, this script cannot do it for you
 * at the Solidity level).
 *
 * Usage:
 *   forge script script/DeployMultiSig.s.sol:DeployMultiSig \
 *     --rpc-url $BOTCHAIN_RPC_URL \
 *     --chain-id $BOTCHAIN_CHAIN_ID \
 *     --broadcast \
 *     --verify \
 *     --verifier blockscout \
 *     --verifier-url $BOTCHAIN_EXPLORER_API_URL
 *
 * Required env vars:
 *   PRIVATE_KEY             — deployer key
 *   BOTCHAIN_RPC_URL        — Botchain RPC endpoint
 *   BOTCHAIN_CHAIN_ID       — Botchain chain id (677 per your config.py)
 *   BOTCHAIN_EXPLORER_API_URL — e.g. https://explorer.bohr.life/api (adjust to your actual explorer)
 */
contract DeployMultiSig is Script {
    function run() external returns (address factory, address sampleController, address sampleWallet) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        console.log("Deployer:", deployer);
        console.log("Chain ID target (expect Botchain):", block.chainid);

        vm.startBroadcast(deployerKey);

        // ── 1. Deploy the factory ────────────────────────────────────────
        MultiSigFactory f = new MultiSigFactory();
        factory = address(f);
        console.log("MultiSigFactory deployed to:", factory);

        // ── 2. Seed one sample MultiSig so the explorer has a verified   ──
        //     reference for CompanyWallet + MultiSigWalletController's
        //     exact bytecode. Adjust these sample params to whatever
        //     minimal valid config createMultiSig() requires.
        // Neither sample owner can be `deployer` — the controller's
        // constructor explicitly requires ownerAddr != _creator (the caller
        // of createMultiSig, i.e. msg.sender == deployer here). Use two
        // placeholder addresses distinct from the deployer. Replace these
        // with real addresses you control if you want this sample usable
        // beyond just seeding verification.
        address[] memory owners = new address[](2);
        owners[0] = address(0x000000000000000000000000000000000000dEaD);
        owners[1] = address(0x000000000000000000000000000000000000bEEF);

        string[] memory names = new string[](2);
        names[0] = "seed-owner-1";
        names[1] = "seed-owner-2";

        uint256[] memory pcts = new uint256[](2);
        pcts[0] = 60;
        pcts[1] = 40;

        bool[] memory removable = new bool[](2);
        removable[0] = true;
        removable[1] = true;

        (sampleController, sampleWallet) = f.createMultiSig(
            "seed-verification-sample",
            owners,
            names,
            pcts,
            removable,
            51,     // requiredPercentage
            0,      // timelockPeriod
            7 days, // expiryPeriod
            2       // minOwners
        );

        console.log("Sample MultiSigWalletController:", sampleController);
        console.log("Sample CompanyWallet:", sampleWallet);

        vm.stopBroadcast();
    }
}