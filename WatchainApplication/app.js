// Import the libraries (express, fs, node multer) using require 
const express = require('express');
const { Web3 } = require('web3');
const fs = require("fs");
const Watchain = require('./build/Watchain.json');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); // Directory to save uploaded files
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
        serialNumber: watchInfo[0],
        model: watchInfo[1],        
        collection: watchInfo[2],    
        dateOfManufacture: watchInfo[3],
        authorizedDealer: watchInfo[4], 
        watchImage: watchInfo[5]  // Changed from 'image' to 'watchImage'
    };
}

function formatOwnershipInfo(ownershipInfo) {
  return {
    ownerId: ownershipInfo[0],    
    ownerName: ownershipInfo[1], 
    contact: ownershipInfo[2], // Changed from ownerContact
    email: ownershipInfo[3],  // Changed from ownerEmail
    transferDate: ownershipInfo[4] // Remove date formatting here  
      
  };
}

function formatServiceHistoryInfo(serviceHistoryInfo) {
  return {
    serviceDate: serviceHistoryInfo[0],  
    serviceDetails: serviceHistoryInfo[1],
  };
}

// In your Express app, add this new endpoint:
app.get('/loading-status', (req, res) => {
    res.json({ loading: loading });
});

//In your Express app, add this new endpoint:
app.get('/loading-status', (req, res) => {
    res.json({ loading: loading });
  });

  app.get('/', async (req, res) => {
    console.log("home page");
    try {
        await componentWillMount();
        console.log(loading);
        res.render('index', { 
            acct: account, 
            cnt: NoOfWatches, 
            watches: listOfWatches,
            loading: false,
            Image: 'default.jpg' // Add a default image if needed
        });
    } catch (error) {
        console.error('Error loading watches:', error);
        res.render('index', {
            acct: account,
            cnt: 0,
            watches: [],
            status: false,
            Image: 'default.jpg'
        });
    }
});

app.get('/watch/:id', async (req, res) => {
    try {
        const watchId = req.params.id;
        
        // Get watch details from smart contract
        const [watchInfo, ownershipInfo, serviceHistoryInfo] = await Promise.all([
            contractInfo.methods.getWatchInfo(watchId).call(),
            contractInfo.methods.getCurrentOwner(watchId).call(),
            contractInfo.methods.getServiceHistory(watchId).call()
        ]);

        const watchDetails = {
            id: watchId,
            watchInfo: formatWatchInfo(watchInfo),
            ownership: formatOwnershipInfo(ownershipInfo),
            serviceHistory: formatServiceHistoryInfo(serviceHistoryInfo)
        };

        res.render('watchDetails', { 
            watch: watchDetails,
            acct: account
        });
    } catch (error) {
        console.error('Error fetching watch details:', error);
        res.status(404).send('Watch not found');
    }
});

// Define routes - to add the watch using the path /registerWatch
app.get('/registerWatch', (req, res) => {
    res.render('registerWatch', { acct: account} ); 
});

app.post('/', upload.single('watchImage'), async (req, res) => {
    console.log('Request body:', req.body);
    const {
        serialNumber, model, collection, dateOfManufacture,
        authorizedDealer, initialOwnerId, initialOwnerName,
        initialOwnerContact, initialOwnerEmail, purchaseDate
    } = req.body;

    // Ensure all fields are present
    if (!serialNumber || !model || !collection || !dateOfManufacture || !authorizedDealer ||
        !initialOwnerId || !initialOwnerName || !initialOwnerContact || !initialOwnerEmail || !purchaseDate) {
        return res.status(400).send('All fields are required.');
    }

    try {
        // Initialize watchImagePath from the uploaded file
        const watchImagePath = req.file ? req.file.filename : null;

        const stringSerialNumber = serialNumber.toString();
        const stringOwnerId = initialOwnerId.toString();    
        const formattedPurchaseDate = new Date(purchaseDate).toISOString();

        // Estimate gas required for the transaction
        const estimatedGas = await contractInfo.methods.registerWatch(
            stringSerialNumber, model, collection, dateOfManufacture,
            authorizedDealer, stringOwnerId, initialOwnerName,
            initialOwnerContact, initialOwnerEmail, formattedPurchaseDate, watchImagePath
        ).estimateGas({ from: account });

        // Send the transaction
        await contractInfo.methods.registerWatch(
            stringSerialNumber, model, collection, dateOfManufacture,
            authorizedDealer, stringOwnerId, initialOwnerName,
            initialOwnerContact, initialOwnerEmail, formattedPurchaseDate, watchImagePath
        ).send({ 
            from: account, 
            gas: BigInt(estimatedGas) + BigInt(50000)
        });

        res.send('Watch registered successfully!');
    } catch (error) {
        console.error('Error registering watch:', error);
        res.status(500).send('Error registering watch');
    }
});


// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
