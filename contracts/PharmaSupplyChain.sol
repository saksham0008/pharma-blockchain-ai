// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PharmaSupplyChain {

    enum Role { None, Admin, Manufacturer, Distributor, Pharmacy, Consumer }

    enum DrugStatus { Active, Recalled, Expired }

    struct TransferEvent {
        address from;
        address to;
        int256  lat;        // latitude * 1e6 (fixed-point)
        int256  lng;        // longitude * 1e6 (fixed-point)
        uint256 timestamp;  // block.timestamp at time of transfer
        uint256 index;      // auto-incrementing sequence (0 = first transfer)
    }

    struct Drug {
        string drugID;
        string name;
        string batchNumber;
        uint256 expiryDate;
        address currentOwner;
        uint256 riskScore;
        bool exists;
        bool recalled;
        TransferEvent[] transferHistory;
    }

    mapping(string => Drug) private drugs;
    mapping(address => Role) public roles;

    address public admin;

    event DrugCreated(string drugID, address manufacturer);
    event DrugTransferred(string drugID, address from, address to, int256 lat, int256 lng, uint256 timestamp);
    event RiskScoreUpdated(string drugID, uint256 riskScore);
    event RoleAssigned(address indexed user, Role role);
    event DrugRecalled(string drugID, uint256 timestamp);

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
        emit RoleAssigned(user, role);
    }

    // Create Drug (Manufacturer only)
    function createDrug(
        string memory _drugID,
        string memory _name,
        string memory _batchNumber,
        uint256 _expiryDate
    ) public onlyRole(Role.Manufacturer) {

        require(!drugs[_drugID].exists, "Drug already exists");

        Drug storage d = drugs[_drugID];
        d.drugID = _drugID;
        d.name = _name;
        d.batchNumber = _batchNumber;
        d.expiryDate = _expiryDate;
        d.currentOwner = msg.sender;
        d.riskScore = 0;
        d.exists = true;
        d.recalled = false;
        // d.transferHistory starts as empty array by default

        emit DrugCreated(_drugID, msg.sender);
    }

    // Transfer drug ownership with geolocation
    function transferDrug(string memory _drugID, address newOwner, int256 _lat, int256 _lng) public {
        require(drugs[_drugID].exists, "Drug not found");
        require(drugs[_drugID].currentOwner == msg.sender, "Not owner");
        require(!drugs[_drugID].recalled, "Cannot transfer recalled drug");

        uint256 idx = drugs[_drugID].transferHistory.length;

        drugs[_drugID].transferHistory.push(TransferEvent({
            from: msg.sender,
            to: newOwner,
            lat: _lat,
            lng: _lng,
            timestamp: block.timestamp,
            index: idx
        }));

        drugs[_drugID].currentOwner = newOwner;

        emit DrugTransferred(_drugID, msg.sender, newOwner, _lat, _lng, block.timestamp);
    }

    // Recall a drug (admin only)
    function recallDrug(string memory _drugID) public onlyAdmin {
        require(drugs[_drugID].exists, "Drug not found");
        require(!drugs[_drugID].recalled, "Drug already recalled");
        drugs[_drugID].recalled = true;
        emit DrugRecalled(_drugID, block.timestamp);
    }

    // Get current status of a drug
    function getDrugStatus(string memory _drugID) public view returns (DrugStatus) {
        require(drugs[_drugID].exists, "Drug not found");
        if (block.timestamp > drugs[_drugID].expiryDate) {
            return DrugStatus.Expired;
        }
        if (drugs[_drugID].recalled) {
            return DrugStatus.Recalled;
        }
        return DrugStatus.Active;
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

    // Get full transfer history for a drug
    function getTransferHistory(string memory _drugID)
        public view returns (TransferEvent[] memory) {
        require(drugs[_drugID].exists, "Drug not found");
        return drugs[_drugID].transferHistory;
    }

    // Get number of transfers for a drug
    function getTransferCount(string memory _drugID)
        public view returns (uint256) {
        require(drugs[_drugID].exists, "Drug not found");
        return drugs[_drugID].transferHistory.length;
    }
}
