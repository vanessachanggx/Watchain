const Watchain = artifacts.require('./contracts/Watchain.sol');

contract('Test Watchain', ([account, seller, buyer]) => {
    let watchain;

    console.log("Account: " + account);
    console.log("Seller: " + seller);
    console.log("Buyer: " + buyer);

    // Deploy a new instance of the contract before running the tests
    before(async () => {
        watchain = await Watchain.deployed(); // Deploy the contract
    });

    describe('deployment', async () => {
        it('deploys successfully, address check verified', async () => {
            // Verify the contract's deployment address
            const address = watchain.address;
            console.log("Contract Address: " + address);

            // Ensure the address is valid
            assert.notEqual(address, 0x0, "Address should not be 0x0");
            assert.notEqual(address, '', "Address should not be an empty string");
            assert.notEqual(address, null, "Address should not be null");
            assert.notEqual(address, undefined, "Address should not be undefined");
        });
    });

    describe('CompanyName', async () => {
        it("has the correct company name", async () => {
            const companyName = await watchain.companyName(); // Call the public variable `companyName`
            assert.equal(companyName, "Watchain", "The company name is not correct");
        });
    });

    describe('Registering watch', async () => {
        let result, watchCount;
    
        before(async () => {
            // Register the watch with all 10 parameters
            result = await watchain.registerWatch(
                "SN12345",                // serialNumber (string)
                "Explorer",               // model (string)
                "Classic Collection",     // collection (string)
                "2021-05-10",             // dateOfManufacture (string)
                "Authorized Dealer",      // authorizedDealer (string)
                "ID001",                  // initialOwnerId (string)
                "John Doe",               // initialOwnerName (string)
                "1234567890",             // initialOwnerContact (string)
                "john@example.com",       // initialOwnerEmail (string)
                "2022-01-01"              // purchaseDate (string)
            );
    
            // Verify the total number of watches after registration
            watchCount = await watchain.getNoOfWatches();
            console.log("Watch Count: " + watchCount.toString());
        });
    
        it('verifying watch ID', async () => {
            const event = result.logs[0].args;
            assert.equal(event.watchId.toNumber(), 1, "Watch ID is correct");
        });
    
        it('verifying watch serial number', async () => {
            const event = result.logs[0].args;
            assert.equal(event.serialNumber, "SN12345", "Watch serial number is correct");
        });
    
        it('verifying watch model', async () => {
            const event = result.logs[0].args;
            assert.equal(event.model, "Explorer", "Watch model is correct");
        });
    
        it('verifying watch collection', async () => {
            const event = result.logs[0].args;
            assert.equal(event.collection, "Classic Collection", "Watch collection is correct");
        });
    
        it('verifying total watch count', async () => {
            assert.notEqual(watchCount.toNumber(), 0, "The watch count should not be zero after registration");
        });
    });
    
    describe('Adding Ownership', async () => {
        let result;
        let watchCount;
    
        before(async () => {
            // Register a watch before adding ownership
            await watchain.registerWatch(
                "SN12345",                // serialNumber
                "Explorer",               // model
                "Classic Collection",     // collection
                "2021-05-10",             // dateOfManufacture
                "Authorized Dealer",      // authorizedDealer
                "ID001",                  // initialOwnerId
                "John Doe",               // initialOwnerName
                "1234567890",             // initialOwnerContact
                "john@example.com",       // initialOwnerEmail
                "2022-01-01"              // purchaseDate
            );
    
            // Add ownership record (new owner)
            result = await watchain.addOwnershipRecord(
                1,                            // watchId
                "OWN002",                      // newOwnerId
                "Alice Johnson",              // newOwnerName
                "2021-05-20",                 // transferDate
                "555-1234",                   // newOwnerContact
                "alice.johnson@example.com",  // newOwnerEmail
                { from: seller }              // Transaction sender (seller address)
            );
    
            watchCount = await watchain.getNoOfWatches();
            console.log("Number of watches: " + watchCount);
        });
    
        it('verifying new owner ID', async () => {
            const event = result.logs[0].args;
            console.log("Watch ID: " + event.watchId);
            assert.equal(event.newOwnerId, "ID002", "New owner ID is correct");
        });
    
        it('verifying new owner name', async () => {
            const event = result.logs[0].args;
            console.log("Watch ID: " + event.watchId);
            assert.equal(event.newOwnerName, "Alice Johnson", "New owner name is correct");
        });
    
        it('verifying transfer date', async () => {
            const event = result.logs[0].args;
            console.log("Watch ID: " + event.watchId);
            assert.equal(event.transferDate, "2021-05-20", "Transfer date is correct");
        });
    
        it('verifying new owner contact', async () => {
            // Verify the contact number in the new ownership record
            const watch = await watchain.getCurrentOwner(1);
            assert.equal(watch.contactNumber, "555-1234", "New owner contact is correct");
        });
    
        it('verifying new owner email', async () => {
            // Verify the email in the new ownership record
            const watch = await watchain.getCurrentOwner(1);
            assert.equal(watch.email, "alice.johnson@example.com", "New owner email is correct");
        });
    });

    describe('Adding Service Record', async () => {
        let result;
        let watchCount;
    
        before(async () => {
            // Register a watch before adding a service record
            await watchain.registerWatch(
                "SN12345",                // serialNumber
                "Explorer",               // model
                "Classic Collection",     // collection
                "2021-05-10",             // dateOfManufacture
                "Authorized Dealer",      // authorizedDealer
                "ID001",                  // initialOwnerId
                "John Doe",               // initialOwnerName
                "1234567890",             // initialOwnerContact
                "john@example.com",       // initialOwnerEmail
                "2022-01-01"              // purchaseDate
            );
    
            // Add a service record for the watch
            result = await watchain.addServiceRecord(
                1,                           // watchId
                "2022-06-15",                 // serviceDate
                "Battery replacement",       // serviceDetails
                "Battery"                    // replacementParts
            );
    
            watchCount = await watchain.getNoOfWatches();
            console.log("Number of watches: " + watchCount);
        });
    
        it('verifying service date', async () => {
            const event = result.logs[0].args;
            console.log("Watch ID: " + event.watchId);
            assert.equal(event.serviceDate, "2022-06-15", "Service date is correct");
        });
    
        it('verifying service details', async () => {
            const event = result.logs[0].args;
            console.log("Watch ID: " + event.watchId);
            assert.equal(event.details, "Battery replacement", "Service details are correct");
        });
    
        it('verifying replacement parts', async () => {
            const event = result.logs[0].args;
            console.log("Watch ID: " + event.watchId);
            assert.equal(event.replacementParts, "Battery", "Replacement parts are correct");
        });
    
        it('verifying service history addition', async () => {
            const serviceHistory = await watchain.getServiceHistory(1);
            const latestServiceRecord = serviceHistory[serviceHistory.length - 1];
            assert.equal(latestServiceRecord.serviceDate, "2022-06-15", "Service date matches the latest record");
            assert.equal(latestServiceRecord.details, "Battery replacement", "Service details match the latest record");
            assert.equal(latestServiceRecord.replacementParts, "Battery", "Replacement parts match the latest record");
        });
    });    
});    
    
