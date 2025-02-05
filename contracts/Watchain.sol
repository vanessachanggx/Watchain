// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Watchain {
    string public companyName;
    uint watchCount;

    constructor() {
        watchCount = 0;
        companyName = "Watchain";
    }

    // Struct for watch details and watch history
    struct Watch {
        string serialNumber;
        string model;
        string collection;
        string dateOfManufacture;
        string authorizedDealer;
        OwnershipRecord currentOwner; // Current owner's details
        OwnershipRecord[] ownershipRecords;
        ServiceHistory[] serviceHistory;
    }

    // Struct for ownership and transfer records
    struct OwnershipRecord {
        string ownerId;
        string ownerName;
        string transferDate;
        string contactNumber;
        string email;
    }

    // Struct for service and maintenance history
    struct ServiceHistory {
        string serviceDate;
        string details;
        string replacementParts; // Set to "null" if no parts were replaced
    }

    mapping(uint256 => Watch) public watches;

     event WatchRegistered(
        uint256 watchId, 
        string serialNumber, 
        string model, 
        string collection
        );

    // Register a new watch
    function registerWatch(
        string memory _serialNumber,
        string memory _model,
        string memory _collection,
        string memory _dateOfManufacture,
        string memory _authorizedDealer,
        string memory _initialOwnerId,
        string memory _initialOwnerName,
        string memory _initialOwnerContact,
        string memory _initialOwnerEmail,
        string memory _purchaseDate
    ) public returns (uint256) {
        watchCount++;

        // Create a new watch and initialize its arrays
        Watch storage newWatch = watches[watchCount];
        newWatch.serialNumber = _serialNumber;
        newWatch.model = _model;
        newWatch.collection = _collection;
        newWatch.dateOfManufacture = _dateOfManufacture;
        newWatch.authorizedDealer = _authorizedDealer;

        // Set the initial owner as the current owner
        OwnershipRecord memory initialOwner = OwnershipRecord(
            _initialOwnerId,
            _initialOwnerName,
            _purchaseDate,
            _initialOwnerContact,
            _initialOwnerEmail
        );
        newWatch.currentOwner = initialOwner;

        // Add the initial owner to ownership records
        newWatch.ownershipRecords.push(initialOwner);
        emit WatchRegistered(watchCount, _serialNumber, _model, _collection);
        
        return watchCount;
    }

    event OwnershipRecorded(
        uint256 watchId, 
        string newOwnerId, 
        string newOwnerName, 
        string transferDate
    );

    // Add ownership transfer record --> appending and updating current owner
    function addOwnershipRecord(
        uint256 watchId,
        string memory _newOwnerId,
        string memory _newOwnerName, 
        string memory _transferDate,
        string memory _newOwnerContact,
        string memory _newOwnerEmail
    ) public {

        // Create a new ownership record
        OwnershipRecord memory newOwner = OwnershipRecord(
            _newOwnerId,
            _newOwnerName,
            _transferDate,
            _newOwnerContact,
            _newOwnerEmail
        );

        // Update the current owner 
        watches[watchId].currentOwner = newOwner;

        // Add the new ownership record to the watch's ownershipRecords array
        watches[watchId].ownershipRecords.push(newOwner);
        emit OwnershipRecorded(watchId, _newOwnerId, _newOwnerName, _transferDate);
    }

    event ServiceRecordAdded(
        uint256 watchId, 
        string serviceDate, 
        string details
    );

    // Add service history record
    function addServiceRecord(
        uint256 watchId,
        string memory _serviceDate,
        string memory _details,
        string memory _replacementParts
    ) public {
        watches[watchId].serviceHistory.push(
            ServiceHistory(
                _serviceDate,
                _details,
                _replacementParts
            )
        );
    emit ServiceRecordAdded(watchId, _serviceDate, _details);
    }

    // Retrieve watch information
    function getWatchInfo(uint256 watchId) public view returns (
        string memory serialNumber,
        string memory model,
        string memory collection,
        string memory dateOfManufacture,
        string memory authorizedDealer
    ) {
        Watch storage watch = watches[watchId];
        return (
            watch.serialNumber,
            watch.model,
            watch.collection,
            watch.dateOfManufacture,
            watch.authorizedDealer
        );
    }

    // Retrieve current owner
    function getCurrentOwner(uint256 watchId) public view returns (OwnershipRecord memory) {
        return watches[watchId].currentOwner;
    }

    // Retrieve ownership records
    function getOwnershipRecords(uint256 watchId) public view returns (OwnershipRecord[] memory) {
        return watches[watchId].ownershipRecords;
    }

    // Retrieve service history
    function getServiceHistory(uint256 watchId) public view returns (ServiceHistory[] memory) {
        return watches[watchId].serviceHistory;
    }

    // Retrieve total number of watches
    function getNoOfWatches() public view returns (uint) {
        return watchCount;
    }
}
