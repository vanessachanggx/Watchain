// Import the libraries (express, fs, node multer) using require 
const express = require('express');
const { Web3 } = require('web3');
const fs = require("fs");
const Watchain = require('./build/Watchain.json');
const multer = require('multer');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/images'); // Directory to save uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); 
  }
});
const upload = multer({ storage: storage });

// Set up view engine from ejs library
const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public')); // Enable static files (such as images, CSS, JS)
app.use(express.urlencoded({ extended: false })); // Enable form processing

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

var GanacheWeb3;
var account = '';
var watchCount = 0;
var watches = [];
let listOfWatches = [];
var contractInfo;

// Function that communicates to the smart contract using the web3 interface
async function componentWillMount() {
    try {
        await loadWeb3();
        await loadBlockchainData();
    } catch (error) {
        console.error('Error in componentWillMount:', error);
    } 
}

// Start loading the blockchain data as the app starts
componentWillMount();  // This will initialize GanacheWeb3 before handling routes

// Ensure componentWillMount is asynchronous to handle blockchain loading
async function loadWeb3() {
    // Initialize GanacheWeb3 properly here
    GanacheWeb3 = new Web3("http://127.0.0.1:7545");
    console.log("GanacheWeb3 initialized:", GanacheWeb3);  // Add a log to verify initialization
}

let loading = false;  // Define the loading variable
let NoOfWatches = 0;  // Initialize NoOfWatches

async function loadBlockchainData() {
  try {
    loading = true;  // Set loading to true when starting the loading process
    const web3 = GanacheWeb3;
    // Load account from the network/blockchain/ganache
    const accounts = await web3.eth.getAccounts();
    account = accounts[0];
    const networkId = await web3.eth.net.getId();
    const networkData = Watchain.networks[networkId];  // Ensure Watchain is defined

    if (!networkData) {
      throw new Error('Watchain contract not deployed to detected network');
    }
    
    contractInfo = new web3.eth.Contract(Watchain.abi, networkData.address);  // Ensure Watchain.abi is defined
    const cnt = await contractInfo.methods.getNoOfWatches().call();
    console.log(`Watch count from blockchain: ${cnt.toString()}`);

    // Initialize the NoOfWatches variable here
    NoOfWatches = cnt;

    const loadSmartContractWatches = async () => {
      const watches = [];
      for (let i = 1; i <= cnt; i++) {
        const [
          watchInfo, ownershipInfo, serviceHistoryInfo
        ] = await Promise.all([
          contractInfo.methods.getWatchInfo(i).call(),
          contractInfo.methods.getCurrentOwner(i).call(),
          contractInfo.methods.getServiceHistory(i).call()
        ]);

        const watchData = {
          id: i,
          watchInfo: formatWatchInfo(watchInfo),
          ownership: formatOwnershipInfo(ownershipInfo),
          serviceHistory: formatServiceHistoryInfo(serviceHistoryInfo)
        };
        watches.push(watchData);
      }
      return watches;
    };

    const [smartContractWatches] = await Promise.all([loadSmartContractWatches()]);

    listOfWatches = smartContractWatches;
    console.log(`Total watches loaded from blockchain: ${listOfWatches.length}`);
    return { account, contractInfo, listOfWatches, NoOfWatches };
  } catch (error) {
    console.error('Error loading blockchain data:', error);
    throw error;
  } finally {
    loading = false;  // Set loading to false once data loading is complete
  }
}

// Define formatting functions for the blockchain data
function formatWatchInfo(watchInfo) {
  return {
    serialNumber: watchInfo[0], // Example of extracting serial number
    model: watchInfo[1],         // Example of extracting model
    collection: watchInfo[2],    // Example of extracting collection
    dateOfManufacture: watchInfo[3], // Example of extracting date of manufacture
    authorizedDealer: watchInfo[4],  // Example of extracting authorized dealer
  };
}

function formatOwnershipInfo(ownershipInfo) {
  return {
    ownerId: ownershipInfo[0],     // Example of extracting ownerId
    ownerName: ownershipInfo[1],   // Example of extracting ownerName
    ownerContact: ownershipInfo[2], // Example of extracting ownerContact
    ownerEmail: ownershipInfo[3],  // Example of extracting ownerEmail
  };
}

function formatServiceHistoryInfo(serviceHistoryInfo) {
  return {
    serviceDate: serviceHistoryInfo[0],  // Example of extracting service date
    serviceDetails: serviceHistoryInfo[1], // Example of extracting service details
  };
}

app.get('/', async (req, res) => {
    console.log("home page");
    await componentWillMount();
    console.log(loading); // Logs the loading status
    res.render('index', { acct: account, cnt: NoOfWatches, watch: listOfWatches, status: loading });
});

// In your Express app, add this new endpoint:
app.get('/loading-status', (req, res) => {
    res.json({ loading: loading });
});

// Define routes - to add the pet using the path /addPet
app.get('/registerWatch', (req, res) => {
    res.render('registerWatch', { acct: account} ); 
});

app.post('/', upload.single('watchImage'), async (req, res) => {
    console.log('Request body:', req.body); // Log the data being received
    const {
        serialNumber, model, collection, dateOfManufacture,
        authorizedDealer, initialOwnerId, initialOwnerName,
        initialOwnerContact, initialOwnerEmail, purchaseDate
    } = req.body;

    // Ensure all fields are present and properly validated before calling the contract
    if (!serialNumber || !model || !collection || !dateOfManufacture || !authorizedDealer ||
        !initialOwnerId || !initialOwnerName || !initialOwnerContact || !initialOwnerEmail || !purchaseDate) {
        return res.status(400).send('All fields are required.');
    }


    try {
        // Explicitly convert BigInt to string if needed
        const stringSerialNumber = serialNumber.toString(); // Ensure it's a string
        const stringOwnerId = initialOwnerId.toString();     // Ensure it's a string

        // Convert the purchase date to ISO string
        const formattedPurchaseDate = new Date(purchaseDate).toISOString(); // Convert date to string

        // Estimate gas required for the transaction
        const estimatedGas = await contractInfo.methods.registerWatch(
            stringSerialNumber, model, collection, dateOfManufacture,
            authorizedDealer, stringOwnerId, initialOwnerName,
            initialOwnerContact, initialOwnerEmail, formattedPurchaseDate, watchImagePath
        ).estimateGas({ from: account });

        // Send the transaction with an increased gas limit
        await contractInfo.methods.registerWatch(
            stringSerialNumber, model, collection, dateOfManufacture,
            authorizedDealer, stringOwnerId, initialOwnerName,
            initialOwnerContact, initialOwnerEmail, formattedPurchaseDate, watchImagePath
        ).send({ 
            from: account, 
            gas: BigInt(estimatedGas) + BigInt(50000) // Adding a buffer to the estimated gas
        });

        res.send('Watch registered successfully!');
    } catch (error) {
        console.error('Error registering watch:', error);
        res.status(500).send('Error registering watch');
    }
});

