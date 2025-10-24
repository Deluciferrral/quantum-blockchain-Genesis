/**
 * Quantum Blockchain Genesis - UI Controller
 * Handles all user interface interactions and updates
 */

// Tab management
function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to selected tab
    event.target.classList.add('active');
    
    // Update content based on tab
    switch(tabName) {
        case 'blockchain':
            updateBlockchainVisual();
            updateTransactionList();
            break;
        case 'defi':
            refreshPools();
            break;
        case 'bridge':
            refreshBridgeStats();
            break;
        case 'consensus':
            refreshConsensusStats();
            refreshValidators();
            break;
    }
}

// Utility functions for UI
function showOutput(elementId, content, isError = false) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.remove('hidden');
        element.textContent = content;
        element.className = `output ${isError ? 'error' : 'success'}`;
    }
}

function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.remove('hidden');
        element.innerHTML = '<div class="loading"><div class="spinner"></div><p>Processing...</p></div>';
        element.className = 'output';
    }
}

function hideOutput(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('hidden');
    }
}

// Dashboard updates
function updateDashboard() {
    if (!quantumBlockchain) return;
    
    // Update stats
    document.getElementById('blockCount').textContent = quantumBlockchain.chain.length;
    document.getElementById('transactionCount').textContent = quantumBlockchain.pendingTransactions.length;
    document.getElementById('totalSupply').textContent = quantumBlockchain.totalSupply;
    
    if (quantumConsensus) {
        const stats = quantumConsensus.getConsensusStats();
        document.getElementById('validatorCount').textContent = stats.activeValidators;
    }
}

// Blockchain tab functions
function updateBlockchainVisual() {
    if (!quantumBlockchain) return;
    
    const visual = document.getElementById('blockchainVisual');
    visual.innerHTML = '';
    
    quantumBlockchain.chain.forEach(block => {
        const blockElement = document.createElement('div');
        blockElement.className = 'block';
        blockElement.innerHTML = `
            <div><strong>Block ${block.index}</strong></div>
            <div>Txns: ${block.data.transactions ? block.data.transactions.length : 0}</div>
            <div class="block-hash">${block.hash ? block.hash.substring(0, 16) + '...' : 'Mining...'}</div>
        `;
        visual.appendChild(blockElement);
    });
}

function updateTransactionList() {
    if (!quantumBlockchain) return;
    
    const list = document.getElementById('transactionList');
    list.innerHTML = '';
    
    // Get recent transactions from all blocks
    const allTransactions = [];
    quantumBlockchain.chain.forEach(block => {
        if (block.data.transactions) {
            block.data.transactions.forEach(tx => {
                allTransactions.push({...tx, blockIndex: block.index});
            });
        }
    });
    
    // Show last 10 transactions
    const recentTx = allTransactions.slice(-10).reverse();
    
    if (recentTx.length === 0) {
        list.innerHTML = '<p>No transactions yet</p>';
        return;
    }
    
    recentTx.forEach(tx => {
        const txElement = document.createElement('div');
        txElement.className = 'transaction-item';
        txElement.innerHTML = `
            <div><strong>Block ${tx.blockIndex}</strong></div>
            <div>From: ${formatAddress(tx.fromAddress || 'Genesis')}</div>
            <div>To: ${formatAddress(tx.toAddress)}</div>
            <div>Amount: ${formatAmount(tx.amount)} QTC</div>
            <div>Time: ${new Date(tx.timestamp).toLocaleTimeString()}</div>
        `;
        list.appendChild(txElement);
    });
}

// Wallet tab functions
async function createWallet() {
    showLoading('walletOutput');
    
    try {
        const wallet = new QuantumWallet();
        const address = await wallet.address;
        
        // Store wallet for later use
        userWallets.set(address, wallet);
        
        showOutput('walletOutput', 
            `Wallet Created Successfully!\n\n` +
            `Address: ${address}\n` +
            `Public Key: ${await wallet.publicKey}\n` +
            `Private Key: ${wallet.privateKey}\n` +
            `Balance: 0 QTC\n\n` +
            `⚠️ Save your private key securely!`
        );
    } catch (error) {
        showOutput('walletOutput', `Error: ${error.message}`, true);
    }
}

function checkBalance() {
    const address = document.getElementById('balanceAddress').value;
    if (!address) {
        showOutput('balanceOutput', 'Please enter a wallet address', true);
        return;
    }

    if (!quantumBlockchain) {
        showOutput('balanceOutput', 'Blockchain not initialized', true);
        return;
    }

    const balance = quantumBlockchain.getBalance(address);
    showOutput('balanceOutput', 
        `Balance for ${formatAddress(address)}: ${formatAmount(balance)} QTC`
    );
}

async function sendTransaction() {
    const fromAddress = document.getElementById('fromAddress').value;
    const toAddress = document.getElementById('toAddress').value;
    const amount = parseFloat(document.getElementById('amount').value);

    if (!fromAddress || !toAddress || !amount) {
        showOutput('transactionOutput', 'Please fill in all fields', true);
        return;
    }

    if (!quantumBlockchain) {
        showOutput('transactionOutput', 'Blockchain not initialized', true);
        return;
    }

    showLoading('transactionOutput');

    try {
        // Check if we have the wallet
        let wallet = userWallets.get(fromAddress);
        if (!wallet) {
            // Create a temporary wallet for demonstration
            wallet = new QuantumWallet();
        }

        const transaction = await wallet.createTransaction(toAddress, amount);
        quantumBlockchain.addTransaction(transaction);
        
        showOutput('transactionOutput', 
            `Transaction Created!\n\n` +
            `From: ${formatAddress(fromAddress)}\n` +
            `To: ${formatAddress(toAddress)}\n` +
            `Amount: ${formatAmount(amount)} QTC\n` +
            `Status: Added to pending pool\n\n` +
            `Mine a block to confirm the transaction.`
        );
    } catch (error) {
        showOutput('transactionOutput', `Error: ${error.message}`, true);
    }
}

async function mineBlock() {
    const minerAddress = document.getElementById('minerAddress').value;
    if (!minerAddress) {
        showOutput('miningOutput', 'Please enter miner address', true);
        return;
    }

    if (!quantumBlockchain) {
        showOutput('miningOutput', 'Blockchain not initialized', true);
        return;
    }

    showLoading('miningOutput');

    try {
        const block = await quantumBlockchain.minePendingTransactions(minerAddress);
        
        showOutput('miningOutput', 
            `Block Mined Successfully!\n\n` +
            `Block Index: ${block.index}\n` +
            `Block Hash: ${block.hash}\n` +
            `Transactions: ${block.data.transactions.length}\n` +
            `Miner Reward: ${quantumBlockchain.miningReward} QTC\n` +
            `Total Blocks: ${quantumBlockchain.chain.length}`
        );
        
        // Update dashboard and visuals
        updateDashboard();
        updateBlockchainVisual();
        updateTransactionList();
        
    } catch (error) {
        showOutput('miningOutput', `Error: ${error.message}`, true);
    }
}

// DeFi tab functions
function createLiquidityPool() {
    const tokenA = document.getElementById('tokenA').value;
    const tokenB = document.getElementById('tokenB').value;
    const amountA = parseFloat(document.getElementById('amountA').value);
    const amountB = parseFloat(document.getElementById('amountB').value);
    const creator = document.getElementById('poolCreator').value;

    if (!tokenA || !tokenB || !amountA || !amountB || !creator) {
        showOutput('poolOutput', 'Please fill in all fields', true);
        return;
    }

    if (!quantumDeFi) {
        showOutput('poolOutput', 'DeFi protocol not initialized', true);
        return;
    }

    showLoading('poolOutput');

    try {
        const poolId = quantumDeFi.createLiquidityPool(tokenA, tokenB, amountA, amountB, creator);
        
        showOutput('poolOutput', 
            `Liquidity Pool Created!\n\n` +
            `Pool ID: ${poolId}\n` +
            `Token Pair: ${tokenA}/${tokenB}\n` +
            `Initial Liquidity: ${formatAmount(amountA)} ${tokenA} / ${formatAmount(amountB)} ${tokenB}\n` +
            `Creator: ${formatAddress(creator)}\n` +
            `Total LP Tokens: ${formatAmount(Math.sqrt(amountA * amountB))}`
        );
        
        // Update pools list
        refreshPools();
        updatePoolSelect();
        
    } catch (error) {
        showOutput('poolOutput', `Error: ${error.message}`, true);
    }
}

function performSwap() {
    const poolSelect = document.getElementById('swapPoolSelect');
    const poolId = poolSelect.value;
    const inputToken = document.getElementById('inputToken').value;
    const inputAmount = parseFloat(document.getElementById('inputAmount').value);
    const minOutput = parseFloat(document.getElementById('minOutput').value);
    const swapperAddress = document.getElementById('swapperAddress').value;

    if (!poolId || !inputToken || !inputAmount || !minOutput || !swapperAddress) {
        showOutput('swapOutput', 'Please fill in all fields', true);
        return;
    }

    if (!quantumDeFi) {
        showOutput('swapOutput', 'DeFi protocol not initialized', true);
        return;
    }

    showLoading('swapOutput');

    try {
        const result = quantumDeFi.swap(poolId, inputToken, inputAmount, minOutput, swapperAddress);
        
        showOutput('swapOutput', 
            `Swap Executed Successfully!\n\n` +
            `Input: ${formatAmount(inputAmount)} ${inputToken}\n` +
            `Output: ${formatAmount(result.amountOut)}\n` +
            `Fee Paid: ${formatAmount(result.fee)}\n` +
            `Trader: ${formatAddress(swapperAddress)}\n` +
            `Pool ID: ${poolId}`
        );
        
        // Refresh pools to show updated reserves
        refreshPools();
        
    } catch (error) {
        showOutput('swapOutput', `Error: ${error.message}`, true);
    }
}

function refreshPools() {
    if (!quantumDeFi) return;
    
    const poolsList = document.getElementById('poolsList');
    poolsList.innerHTML = '';
    
    if (quantumDeFi.liquidityPools.size === 0) {
        poolsList.innerHTML = '<p>No liquidity pools created yet.</p>';
        return;
    }
    
    quantumDeFi.liquidityPools.forEach((pool, poolId) => {
        const poolElement = document.createElement('div');
        poolElement.className = 'pool-item';
        poolElement.innerHTML = `
            <div><strong>${pool.tokenA}/${pool.tokenB} Pool</strong></div>
            <div>Pool ID: ${poolId}</div>
            <div>Reserves: ${formatAmount(pool.reserveA)} ${pool.tokenA} / ${formatAmount(pool.reserveB)} ${pool.tokenB}</div>
            <div>Total Liquidity: ${formatAmount(pool.totalLiquidity)}</div>
            <div>Creator: ${formatAddress(pool.creator)}</div>
            <div>Created: ${new Date(pool.createdAt).toLocaleDateString()}</div>
        `;
        poolsList.appendChild(poolElement);
    });
}

function updatePoolSelect() {
    if (!quantumDeFi) return;
    
    const select = document.getElementById('swapPoolSelect');
    select.innerHTML = '<option value="">Select a liquidity pool</option>';
    
    quantumDeFi.liquidityPools.forEach((pool, poolId) => {
        const option = document.createElement('option');
        option.value = poolId;
        option.textContent = `${pool.tokenA}/${pool.tokenB} Pool`;
        select.appendChild(option);
    });
}

function stakeTokens() {
    const amount = parseFloat(document.getElementById('stakeAmount').value);
    const staker = document.getElementById('stakerAddress').value;

    if (!amount || !staker) {
        showOutput('stakingOutput', 'Please fill in all fields', true);
        return;
    }

    if (!quantumDeFi) {
        showOutput('stakingOutput', 'DeFi protocol not initialized', true);
        return;
    }

    try {
        const result = quantumDeFi.stake(amount, staker);
        
        showOutput('stakingOutput', 
            `Tokens Staked Successfully!\n\n` +
            `Amount Staked: ${formatAmount(amount)} QTC\n` +
            `Pool ID: ${result.poolId}\n` +
            `Total Staked: ${formatAmount(result.totalStaked)} QTC\n` +
            `Staker: ${formatAddress(staker)}\n\n` +
            `You will earn staking rewards over time.`
        );
        
    } catch (error) {
        showOutput('stakingOutput', `Error: ${error.message}`, true);
    }
}

function unstakeTokens() {
    showOutput('stakingOutput', 'Unstaking feature coming soon!', false);
}

// Bridge tab functions
async function lockBitcoin() {
    const bitcoinTxHash = document.getElementById('btcTxHash').value;
    const amount = parseFloat(document.getElementById('btcAmount').value);
    const quantumRecipient = document.getElementById('quantumRecipient').value;

    if (!bitcoinTxHash || !amount || !quantumRecipient) {
        showOutput('lockOutput', 'Please fill in all fields', true);
        return;
    }

    if (!bitcoinBridge) {
        showOutput('lockOutput', 'Bridge not initialized', true);
        return;
    }

    showLoading('lockOutput');

    try {
        const result = await bitcoinBridge.lockBitcoinAndMint(bitcoinTxHash, amount, quantumRecipient);
        
        showOutput('lockOutput', 
            `Bitcoin Locked Successfully!\n\n` +
            `Bitcoin TX: ${bitcoinTxHash}\n` +
            `Amount Locked: ${formatAmount(amount)} BTC\n` +
            `Quantum Minted: ${formatAmount(result.mintAmount)} QTC\n` +
            `Bridge Fee: ${formatAmount(result.fee)} BTC\n` +
            `Transfer ID: ${result.transferId}\n` +
            `Recipient: ${formatAddress(quantumRecipient)}`
        );
        
        refreshBridgeStats();
        
    } catch (error) {
        showOutput('lockOutput', `Error: ${error.message}`, true);
    }
}

async function burnQuantum() {
    const quantumSender = document.getElementById('quantumSender').value;
    const amount = parseFloat(document.getElementById('quantumAmount').value);
    const bitcoinRecipient = document.getElementById('btcRecipient').value;

    if (!quantumSender || !amount || !bitcoinRecipient) {
        showOutput('burnOutput', 'Please fill in all fields', true);
        return;
    }

    if (!bitcoinBridge) {
        showOutput('burnOutput', 'Bridge not initialized', true);
        return;
    }

    showLoading('burnOutput');

    try {
        const result = await bitcoinBridge.burnQuantumAndUnlock(quantumSender, amount, bitcoinRecipient);
        
        showOutput('burnOutput', 
            `Quantum Tokens Burned Successfully!\n\n` +
            `Amount Burned: ${formatAmount(amount)} QTC\n` +
            `Bitcoin Unlocked: ${formatAmount(result.unlockAmount)} BTC\n` +
            `Bitcoin TX: ${result.bitcoinTxHash}\n` +
            `Bridge Fee: ${formatAmount(result.fee)} QTC\n` +
            `Transfer ID: ${result.transferId}\n` +
            `Bitcoin Recipient: ${formatAddress(bitcoinRecipient)}`
        );
        
        refreshBridgeStats();
        
    } catch (error) {
        showOutput('burnOutput', `Error: ${error.message}`, true);
    }
}

function refreshBridgeStats() {
    if (!bitcoinBridge) return;
    
    const stats = bitcoinBridge.getBridgeStats();
    
    document.getElementById('totalLocked').textContent = formatAmount(stats.totalLocked);
    document.getElementById('totalMinted').textContent = formatAmount(stats.totalMinted);
    document.getElementById('bridgeFee').textContent = (stats.bridgeFee * 100).toFixed(1) + '%';
    document.getElementById('activeTransfers').textContent = stats.activeTransfers;
}

function getBridgeHistory() {
    const address = document.getElementById('historyAddress').value;
    if (!address) {
        showOutput('bridgeHistory', 'Please enter an address', true);
        return;
    }

    if (!bitcoinBridge) {
        showOutput('bridgeHistory', 'Bridge not initialized', true);
        return;
    }

    const history = bitcoinBridge.transferHistory.filter(transfer => 
        transfer.type === 'bitcoin_to_quantum' ? true : 
        transfer.type === 'quantum_to_bitcoin' ? true : false
    );

    const historyDiv = document.getElementById('bridgeHistory');
    historyDiv.innerHTML = '';

    if (history.length === 0) {
        historyDiv.innerHTML = '<p>No transfer history found.</p>';
        return;
    }

    history.forEach(transfer => {
        const transferElement = document.createElement('div');
        transferElement.className = 'transaction-item';
        transferElement.innerHTML = `
            <div><strong>${transfer.type.replace('_', ' ').toUpperCase()}</strong></div>
            <div>Transfer ID: ${transfer.transferId}</div>
            <div>Amount: ${formatAmount(transfer.amount || transfer.unlockAmount)}</div>
            <div>Status: ${transfer.status}</div>
            <div>Time: ${new Date(transfer.timestamp).toLocaleString()}</div>
        `;
        historyDiv.appendChild(transferElement);
    });
}

// Consensus tab functions
function registerValidator() {
    const address = document.getElementById('validatorAddress').value;
    const publicKey = document.getElementById('validatorPubKey').value;
    const initialStake = parseFloat(document.getElementById('initialStake').value);

    if (!address || !publicKey || !initialStake) {
        showOutput('validatorOutput', 'Please fill in all fields', true);
        return;
    }

    if (initialStake < 1000) {
        showOutput('validatorOutput', 'Minimum stake is 1000 tokens', true);
        return;
    }

    if (!quantumConsensus) {
        showOutput('validatorOutput', 'Consensus not initialized', true);
        return;
    }

    showLoading('validatorOutput');

    try {
        const validator = quantumConsensus.registerValidator(address, publicKey, initialStake);
        
        showOutput('validatorOutput', 
            `Validator Registered Successfully!\n\n` +
            `Address: ${formatAddress(validator.address)}\n` +
            `Stake: ${formatAmount(validator.stake)} QTC\n` +
            `Reputation: ${validator.reputation}\n` +
            `Status: ${validator.isActive ? 'Active' : 'Inactive'}\n` +
            `Joined Epoch: ${validator.joinedEpoch}`
        );
        
        refreshValidators();
        refreshConsensusStats();
        updateDashboard();
        
    } catch (error) {
        showOutput('validatorOutput', `Error: ${error.message}`, true);
    }
}

function refreshConsensusStats() {
    if (!quantumConsensus) return;
    
    const stats = quantumConsensus.getConsensusStats();
    
    document.getElementById('currentEpoch').textContent = stats.currentEpoch;
    document.getElementById('activeValidators').textContent = stats.activeValidators;
    document.getElementById('totalStake').textContent = formatAmount(stats.totalStake);
    document.getElementById('networkHashRate').textContent = '1.2 TH/s'; // Simulated
}

function refreshValidators() {
    if (!quantumConsensus) return;
    
    const validatorsList = document.getElementById('validatorsList');
    validatorsList.innerHTML = '';
    
    if (quantumConsensus.validators.size === 0) {
        validatorsList.innerHTML = '<p>No validators registered yet.</p>';
        return;
    }
    
    quantumConsensus.validators.forEach((validator, address) => {
        const validatorElement = document.createElement('div');
        validatorElement.className = 'validator-item';
        validatorElement.innerHTML = `
            <div><strong>${formatAddress(validator.address)}</strong></div>
            <div>Stake: ${formatAmount(validator.stake)} QTC</div>
            <div>Reputation: ${validator.reputation}/100</div>
            <div>Status: ${validator.isActive ? '✅ Active' : '❌ Inactive'}</div>
            <div>Blocks Validated: ${validator.totalValidatedBlocks}</div>
            <div>Joined: Epoch ${validator.joinedEpoch}</div>
        `;
        validatorsList.appendChild(validatorElement);
    });
}

function createProposal() {
    const title = document.getElementById('proposalTitle').value;
    const description = document.getElementById('proposalDescription').value;
    const proposer = document.getElementById('proposerAddress').value;

    if (!title || !description || !proposer) {
        showOutput('proposalOutput', 'Please fill in all fields', true);
        return;
    }

    if (!quantumConsensus) {
        showOutput('proposalOutput', 'Consensus not initialized', true);
        return;
    }

    try {
        const proposal = quantumConsensus.createProposal(title, description, proposer);
        
        showOutput('proposalOutput', 
            `Governance Proposal Created!\n\n` +
            `Proposal ID: ${proposal.id}\n` +
            `Title: ${proposal.title}\n` +
            `Proposer: ${formatAddress(proposal.proposer)}\n` +
            `Status: ${proposal.status}\n` +
            `Created: ${new Date(proposal.createdAt).toLocaleString()}\n\n` +
            `Validators can now vote on this proposal.`
        );
        
    } catch (error) {
        showOutput('proposalOutput', `Error: ${error.message}`, true);
    }
}

// Auto-refresh functions
function startAutoRefresh() {
    setInterval(() => {
        updateDashboard();
        
        // Refresh current tab content
        const activeTab = document.querySelector('.tab.active');
        if (activeTab) {
            const tabName = activeTab.textContent.toLowerCase().split(' ')[1]; // Extract tab name
            switch(tabName) {
                case 'blockchain':
                    updateBlockchainVisual();
                    updateTransactionList();
                    break;
                case 'bridge':
                    refreshBridgeStats();
                    break;
                case 'consensus':
                    refreshConsensusStats();
                    break;
            }
        }
    }, 10000); // Update every 10 seconds
}

// Initialize UI when system is ready
setTimeout(() => {
    if (quantumBlockchain) {
        updateDashboard();
        updateBlockchainVisual();
        updateTransactionList();
        updatePoolSelect();
        startAutoRefresh();
    }
}, 2000);