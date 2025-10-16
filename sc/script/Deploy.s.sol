// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/MinimalForwarder.sol";
import "../src/DAOVoting.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        uint256 minimumBalance = vm.envOr("MINIMUM_BALANCE", uint256(0.1 ether));

        vm.startBroadcast(deployerPrivateKey);

        // Deploy MinimalForwarder first
        MinimalForwarder forwarder = new MinimalForwarder();
        console.log("MinimalForwarder deployed at:", address(forwarder));

        // Deploy DAOVoting with forwarder address
        DAOVoting dao = new DAOVoting(address(forwarder), minimumBalance);
        console.log("DAOVoting deployed at:", address(dao));

        vm.stopBroadcast();

        // Log deployment info
        console.log("\n=== Deployment Summary ===");
        console.log("MinimalForwarder:", address(forwarder));
        console.log("DAOVoting:", address(dao));
        console.log("Minimum Balance:", minimumBalance);
        console.log("==========================\n");
    }
}
