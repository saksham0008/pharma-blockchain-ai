// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PharmaSupplyChain {

    enum Role { None, Manufacturer, Distributor, Pharmacy }

    struct Drug {
        string drugID;
        string name;
        string batchNumber;
        uint256 expiryDate;
        address currentOwner;
        uint256 riskScore;
        bool exists;
    }

    mapping(string => Drug) private drugs;
    mapping(address => Role) public roles;

    address public admin;

    event DrugCreated(string drugID, address manufacturer);
    event DrugTransferred(string drugID, address from, address to);
    event RiskScoreUpdated(string drugID, uint256 riskScore);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    modifier onlyRole(Role role) {
        require(roles[msg.sender] == role, "Unauthorized role");
        _;
    }

    // Assign role to user
    function assignRole(address user, Role role) public onlyAdmin {
        roles[user] = role;
    }

    // Create Drug (Manufacturer only)
    function createDrug(
        string memory _drugID,
        string memory _name,
        string memory _batchNumber,
        uint256 _expiryDate
    ) public onlyRole(Role.Manufacturer) {

        require(!drugs[_drugID].exists, "Drug already exists");

        drugs[_drugID] = Drug({
            drugID: _drugID,
            name: _name,
            batchNumber: _batchNumber,
            expiryDate: _expiryDate,
            currentOwner: msg.sender,
            riskScore: 0,
            exists: true
        });

        emit DrugCreated(_drugID, msg.sender);
    }

    // Transfer drug ownership
    function transferDrug(string memory _drugID, address newOwner) public {

        require(drugs[_drugID].exists, "Drug not found");
        require(drugs[_drugID].currentOwner == msg.sender, "Not owner");

        drugs[_drugID].currentOwner = newOwner;

        emit DrugTransferred(_drugID, msg.sender, newOwner);
    }

    // Update Risk Score (from ML system)
    function updateRiskScore(string memory _drugID, uint256 _riskScore) public onlyAdmin {

        require(drugs[_drugID].exists, "Drug not found");

        drugs[_drugID].riskScore = _riskScore;

        emit RiskScoreUpdated(_drugID, _riskScore);
    }

    // Get drug details
    function getDrug(string memory _drugID)
        public view returns (Drug memory) {

        require(drugs[_drugID].exists, "Drug not found");
        return drugs[_drugID];
    }
}