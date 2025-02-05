const { Web3 } = require('web3');
const fs = require('fs');
require('dotenv').config();

async function main() {
    try {
        // Initialize Web3 with websocket provider for better stability
        // Configuring the connection to an Ethereum node const network = process.env.ETHEREUM_NETWORK;
        const network = process.env.ETHEREUM_NETWORK;

        const web3 = new Web3(
          new Web3.providers.HttpProvider(
            `https://${network}.infura.io/v3/${process.env.API_KEY}`,
          ),
        );
          
        // Load the contract JSON
        const contractJson = JSON.parse(fs.readFileSync('build/contracts/Watchain.json'));
        
        // Get the private key from environment
        const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error('Private key not found in environment variables');
        }
             
        // Create account from private key
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);
        web3.eth.accounts.wallet.add(account);
        console.log('Deploying from address:', account.address);

        // Get account balance
        const balance = await web3.eth.getBalance(account.address);
        console.log('Account balance:', web3.utils.fromWei(balance, 'ether'), 'ETH');

        // Create contract instance
        const Contract = new web3.eth.Contract(contractJson.abi);
        //console.log(contractJson.bytecode);
 
        // Prepare deploy transaction
        const deploy = Contract.deploy({
              data: contractJson.bytecode,
              arguments: [] // No constructor arguments needed
        })

        // Get gas price
        const gasPrice = await web3.eth.getGasPrice();
        console.log('Current gas price:', gasPrice);

        // Get block gas limit
        const block = await web3.eth.getBlock('latest');
        console.log('Block gas limit:', block.gasLimit);

        try {
            // Estimate gas
            const gasEstimate = await deploy.estimateGas({
                from: account.address
            });
            console.log('Estimated gas:', gasEstimate);
            
            // Deploy with estimated gas
            console.log('Deploying contract...');
            const deployedContract = await deploy.send({
                from: account.address,
                //gas: Math.min(gasEstimate * 1.2, block.gasLimit),
                gas: String(Math.ceil(Number(gasEstimate) * 1.2)),
                gasPrice: gasPrice                
            })
            console.log('Contract deployed at:', deployedContract.options.address);

            // Verify the contract was deployed successfully
            const code = await web3.eth.getCode(deployedContract.options.address);
            if (code === '0x' || code === '0x0') {
                throw new Error('Contract deployment failed - no code at address');
            }
            // Try to call the getCompanyName function
            const companyName = await deployedContract.methods.companyName().call();
            console.log('Company name:', companyName);
            return deployedContract;
        } catch (estimateError) {
            console.error('Deployment error:', {
                message: estimateError.message,
                code: estimateError.code,
                data: estimateError.data
            });
            throw estimateError;
        }
      } catch (error) {
        console.error('Fatal error:', error);
        throw error;
      }
}

// Execute deployment
main()
    .then(() => {
        console.log('Deployment completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Deployment failed:', error);
        process.exit(1);
    });

