/**
 * Quantum Blockchain Genesis - Standalone Core Implementation
 * Pure JavaScript implementation without Node.js dependencies
 * Genesis Bitcoin Address: bc1qkm8plv5449r3t53dge6x6rmutk3wtkjlwczx8h
 */

class QuantumCrypto {
    static sha256(message) {
        // Simple SHA-256 implementation for demonstration
        // In production, use Web Crypto API or a proper library
        const msgUint8 = new TextEncoder().encode(message);
        return crypto.subtle.digest('SHA-256', msgUint8).then(hashBuffer => {
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        });
    }

    static async sha3(message) {
        // Simulate SHA-3 with SHA-256 for browser compatibility
        return await this.sha256(message + '_sha3_salt');
    }

    static generateRandomBytes(length) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    static generateQuantumSignature() {
        return {
            algorithm: 'CRYSTALS-Dilithium',
            signature: this.generateRandomBytes(64),
            timestamp: Date.now(),
            quantumProof: this.generateRandomBytes(32)
        };
    }
}

class QuantumBlock {
    constructor(index, previousHash, timestamp, data, nonce = 0) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.nonce = nonce;
        this.hash = null;
        this.quantumSignature = QuantumCrypto.generateQuantumSignature();
    }

    async calculateHash() {
        const blockString = this.index + this.previousHash + this.timestamp + 
                           JSON.stringify(this.data) + this.nonce;
        const sha256Hash = await QuantumCrypto.sha256(blockString);
        const sha3Hash = await QuantumCrypto.sha3(sha256Hash);
        return sha3Hash;
    }

    async mineBlock(difficulty) {
        const target = Array(difficulty + 1).join("0");
        
        while (this.hash === null || this.hash.substring(0, difficulty) !== target) {
            this.nonce++;
            this.hash = await this.calculateHash();
        }
        
        console.log(`Block mined: ${this.hash}`);
        return this.hash;
    }
}

class QuantumTransaction {
    constructor(fromAddress, toAddress, amount, data = {}) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.timestamp = Date.now();
        this.data = data;
        this.signature = null;
        this.quantumProof = QuantumCrypto.generateQuantumSignature();
        this.txHash = this.calculateHash();
    }

    calculateHash() {
        return QuantumCrypto.sha256(
            this.fromAddress + this.toAddress + this.amount + 
            this.timestamp + JSON.stringify(this.data)
        );
    }

    signTransaction() {
        // Simulate transaction signing with quantum signature
        this.signature = QuantumCrypto.generateQuantumSignature();
        return this.signature;
    }

    isValid() {
        if (this.fromAddress === null) return true; // Mining reward
        return this.signature !== null && this.quantumProof !== null;
    }
}

class QuantumWallet {
    constructor() {
        this.privateKey = QuantumCrypto.generateRandomBytes(32);
        this.publicKey = this.generatePublicKey();
        this.address = this.generateAddress();
        this.balance = 0;
        this.transactions = [];
    }

    generatePublicKey() {
        return QuantumCrypto.sha256(this.privateKey);
    }

    generateAddress() {
        const hash = QuantumCrypto.sha256(this.publicKey);
        return hash.then(h => 'qb1' + h.substring(0, 39));
    }

    async createTransaction(toAddress, amount, data = {}) {
        const transaction = new QuantumTransaction(await this.address, toAddress, amount, data);
        transaction.signTransaction();
        this.transactions.push(transaction);
        return transaction;
    }
}

class QuantumBlockchain {
    constructor() {
        this.chain = [];
        this.difficulty = 4;
        this.pendingTransactions = [];
        this.miningReward = 100;
        this.genesisAddress = 'bc1qkm8plv5449r3t53dge6x6rmutk3wtkjlwczx8h';
        this.balances = new Map();
        this.totalSupply = 0;
        this.initialize();
    }

    async initialize() {
        const genesisBlock = await this.createGenesisBlock();
        this.chain.push(genesisBlock);
        this.balances.set(this.genesisAddress, 10000);
        this.totalSupply = 10000;
    }

    async createGenesisBlock() {
        const genesisData = {
            message: "behold light and it is good",
            bitcoinAddress: this.genesisAddress,
            timestamp: Date.now(),
            creator: "Genesis Team",
            transactions: [],
            quantumSignature: QuantumCrypto.generateQuantumSignature()
        };
        
        const block = new QuantumBlock(0, "0", "2025-10-24T00:00:00Z", genesisData);
        block.hash = await block.calculateHash();
        return block;
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addTransaction(transaction) {
        if (!transaction.fromAddress || !transaction.toAddress) {
            throw new Error('Transaction must include from and to address');
        }

        if (!this.isTransactionValid(transaction)) {
            throw new Error('Cannot add invalid transaction to chain');
        }

        this.pendingTransactions.push(transaction);
    }

    getBalance(address) {
        return this.balances.get(address) || 0;
    }

    async minePendingTransactions(miningRewardAddress) {
        const rewardTransaction = new QuantumTransaction(
            null, 
            miningRewardAddress, 
            this.miningReward,
            { type: 'mining_reward' }
        );

        this.pendingTransactions.push(rewardTransaction);

        const block = new QuantumBlock(
            this.getLatestBlock().index + 1,
            this.getLatestBlock().hash,
            Date.now(),
            {
                transactions: [...this.pendingTransactions],
                quantumProof: QuantumCrypto.generateQuantumSignature()
            }
        );

        await block.mineBlock(this.difficulty);
        
        console.log('Block successfully mined!');
        this.chain.push(block);
        
        // Update balances
        this.updateBalances(this.pendingTransactions);
        
        this.pendingTransactions = [];
        this.totalSupply += this.miningReward;
        
        return block;
    }

    updateBalances(transactions) {
        for (const transaction of transactions) {
            if (transaction.fromAddress) {
                const fromBalance = this.getBalance(transaction.fromAddress);
                this.balances.set(transaction.fromAddress, fromBalance - transaction.amount);
            }
            
            if (transaction.toAddress) {
                const toBalance = this.getBalance(transaction.toAddress);
                this.balances.set(transaction.toAddress, toBalance + transaction.amount);
            }
        }
    }

    isTransactionValid(transaction) {
        if (transaction.fromAddress === null) return true; // Mining reward

        const fromBalance = this.getBalance(transaction.fromAddress);
        if (fromBalance < transaction.amount) {
            throw new Error('Insufficient balance');
        }

        return transaction.isValid();
    }

    async isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            const recalculatedHash = await currentBlock.calculateHash();
            if (currentBlock.hash !== recalculatedHash) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }

    getTransactionHistory(address) {
        const transactions = [];

        for (const block of this.chain) {
            for (const trans of block.data.transactions || []) {
                if (trans.fromAddress === address || trans.toAddress === address) {
                    transactions.push({
                        ...trans,
                        blockIndex: block.index,
                        blockHash: block.hash
                    });
                }
            }
        }

        return transactions;
    }
}

class QuantumDeFi {
    constructor(blockchain) {
        this.blockchain = blockchain;
        this.liquidityPools = new Map();
        this.stakingPools = new Map();
        this.protocolFee = 0.003; // 0.3%
    }

    createLiquidityPool(tokenA, tokenB, amountA, amountB, creator) {
        const poolId = QuantumCrypto.generateRandomBytes(16);
        
        const pool = {
            id: poolId,
            tokenA,
            tokenB,
            reserveA: amountA,
            reserveB: amountB,
            totalLiquidity: Math.sqrt(amountA * amountB),
            creator,
            createdAt: Date.now(),
            lpTokens: new Map(),
            quantumSignature: QuantumCrypto.generateQuantumSignature()
        };

        this.liquidityPools.set(poolId, pool);
        pool.lpTokens.set(creator, pool.totalLiquidity);

        return poolId;
    }

    swap(poolId, tokenIn, amountIn, minAmountOut, trader) {
        const pool = this.liquidityPools.get(poolId);
        if (!pool) throw new Error('Pool not found');

        let reserveIn, reserveOut;
        
        if (tokenIn === pool.tokenA) {
            reserveIn = pool.reserveA;
            reserveOut = pool.reserveB;
        } else if (tokenIn === pool.tokenB) {
            reserveIn = pool.reserveB;
            reserveOut = pool.reserveA;
        } else {
            throw new Error('Invalid token');
        }

        // Apply protocol fee
        const amountInWithFee = amountIn * (1 - this.protocolFee);
        
        // Constant product formula: x * y = k
        const amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);

        if (amountOut < minAmountOut) {
            throw new Error('Insufficient output amount');
        }

        // Update reserves
        if (tokenIn === pool.tokenA) {
            pool.reserveA += amountIn;
            pool.reserveB -= amountOut;
        } else {
            pool.reserveB += amountIn;
            pool.reserveA -= amountOut;
        }

        return { amountOut, fee: amountIn * this.protocolFee };
    }

    createStakingPool(stakingToken, rewardRate) {
        const poolId = QuantumCrypto.generateRandomBytes(16);
        
        const pool = {
            id: poolId,
            stakingToken,
            rewardRate,
            totalStaked: 0,
            stakers: new Map(),
            createdAt: Date.now()
        };

        this.stakingPools.set(poolId, pool);
        return poolId;
    }

    stake(amount, staker) {
        // Default staking pool
        const defaultPoolId = 'default_staking_pool';
        if (!this.stakingPools.has(defaultPoolId)) {
            this.createStakingPool('QTC', 0.05);
            this.stakingPools.set(defaultPoolId, this.stakingPools.get(this.stakingPools.keys().next().value));
        }

        const pool = this.stakingPools.get(defaultPoolId);
        const currentStake = pool.stakers.get(staker) || 0;
        
        pool.stakers.set(staker, currentStake + amount);
        pool.totalStaked += amount;

        return { poolId: defaultPoolId, totalStaked: currentStake + amount };
    }
}

class BitcoinQuantumBridge {
    constructor(blockchain) {
        this.blockchain = blockchain;
        this.genesisAddress = 'bc1qkm8plv5449r3t53dge6x6rmutk3wtkjlwczx8h';
        this.bridgeContract = null;
        this.lockedFunds = new Map();
        this.bridgeFee = 0.001; // 0.1%
        this.totalLocked = 0;
        this.totalMinted = 0;
        this.transferHistory = [];
        this.initialize();
    }

    initialize() {
        this.bridgeContract = {
            address: 'qb1bridge' + QuantumCrypto.generateRandomBytes(16),
            bitcoinAddress: this.genesisAddress,
            totalLocked: 0,
            totalMinted: 0,
            transactions: []
        };
    }

    async lockBitcoinAndMint(bitcoinTxHash, amount, quantumRecipient) {
        // Simulate Bitcoin transaction verification
        if (!bitcoinTxHash || bitcoinTxHash.length < 10) {
            throw new Error('Invalid Bitcoin transaction hash');
        }

        const mintAmount = amount * (1 - this.bridgeFee);
        const transferId = QuantumCrypto.generateRandomBytes(16);

        this.lockedFunds.set(transferId, {
            bitcoinTxHash,
            amount,
            mintAmount,
            quantumRecipient,
            timestamp: Date.now(),
            status: 'completed'
        });

        // Update bridge statistics
        this.totalLocked += amount;
        this.totalMinted += mintAmount;
        
        // Add to history
        this.transferHistory.push({
            transferId,
            type: 'bitcoin_to_quantum',
            amount,
            mintAmount,
            timestamp: Date.now(),
            status: 'completed'
        });

        return { 
            transferId, 
            mintAmount, 
            fee: amount * this.bridgeFee,
            bitcoinTxHash 
        };
    }

    async burnQuantumAndUnlock(quantumSender, amount, bitcoinRecipient) {
        const unlockAmount = amount * (1 - this.bridgeFee);
        const transferId = QuantumCrypto.generateRandomBytes(16);
        
        // Simulate Bitcoin transaction creation
        const bitcoinTxHash = QuantumCrypto.generateRandomBytes(32);

        // Update bridge statistics
        this.totalMinted -= amount;
        this.totalLocked -= unlockAmount;

        // Add to history
        this.transferHistory.push({
            transferId,
            type: 'quantum_to_bitcoin',
            amount,
            unlockAmount,
            timestamp: Date.now(),
            status: 'completed'
        });

        return { 
            transferId, 
            unlockAmount, 
            bitcoinTxHash, 
            fee: amount * this.bridgeFee 
        };
    }

    getBridgeStats() {
        return {
            genesisAddress: this.genesisAddress,
            bridgeContract: this.bridgeContract?.address,
            totalLocked: this.totalLocked,
            totalMinted: this.totalMinted,
            bridgeFee: this.bridgeFee,
            activeTransfers: this.transferHistory.length
        };
    }
}

class QuantumConsensus {
    constructor(blockchain) {
        this.blockchain = blockchain;
        this.validators = new Map();
        this.currentEpoch = 0;
        this.minimumStake = 1000;
        this.genesisValidator = 'bc1qkm8plv5449r3t53dge6x6rmutk3wtkjlwczx8h';
        this.initializeGenesisValidator();
    }

    initializeGenesisValidator() {
        this.validators.set(this.genesisValidator, {
            address: this.genesisValidator,
            publicKey: QuantumCrypto.generateRandomBytes(32),
            stake: 10000,
            isActive: true,
            reputation: 100,
            totalValidatedBlocks: 0,
            joinedEpoch: 0
        });
    }

    registerValidator(address, publicKey, initialStake) {
        if (this.validators.has(address)) {
            throw new Error('Validator already registered');
        }

        if (initialStake < this.minimumStake) {
            throw new Error(`Minimum stake required: ${this.minimumStake}`);
        }

        const validator = {
            address,
            publicKey,
            stake: initialStake,
            isActive: true,
            reputation: 50,
            totalValidatedBlocks: 0,
            joinedEpoch: this.currentEpoch
        };

        this.validators.set(address, validator);
        return validator;
    }

    getConsensusStats() {
        const activeValidators = Array.from(this.validators.values())
            .filter(v => v.isActive);

        const totalStake = activeValidators.reduce((sum, v) => sum + v.stake, 0);

        return {
            currentEpoch: this.currentEpoch,
            activeValidators: activeValidators.length,
            totalValidators: this.validators.size,
            totalStake,
            averageReputation: activeValidators.reduce((sum, v) => sum + v.reputation, 0) / activeValidators.length,
            genesisValidator: this.genesisValidator
        };
    }

    createProposal(title, description, proposer) {
        const proposalId = QuantumCrypto.generateRandomBytes(16);
        
        return {
            id: proposalId,
            title,
            description,
            proposer,
            votesFor: 0,
            votesAgainst: 0,
            createdAt: Date.now(),
            status: 'active'
        };
    }
}

// Global instances
let quantumBlockchain;
let quantumDeFi;
let bitcoinBridge;
let quantumConsensus;
let userWallets = new Map();

// Initialize the quantum blockchain system
async function initializeQuantumSystem() {
    try {
        console.log('🚀 Initializing Quantum Blockchain Genesis...');
        
        quantumBlockchain = new QuantumBlockchain();
        
        // Wait for blockchain initialization
        setTimeout(() => {
            quantumDeFi = new QuantumDeFi(quantumBlockchain);
            bitcoinBridge = new BitcoinQuantumBridge(quantumBlockchain);
            quantumConsensus = new QuantumConsensus(quantumBlockchain);
            
            console.log('✅ Quantum Blockchain Genesis initialized successfully');
            console.log(`📍 Genesis Bitcoin Address: ${quantumBlockchain.genesisAddress}`);
            
            // Update UI
            updateDashboard();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Initialization failed:', error);
    }
}

// Utility functions
function generateTransactionId() {
    return 'tx_' + QuantumCrypto.generateRandomBytes(8);
}

function formatAddress(address) {
    if (address.length > 20) {
        return address.substring(0, 10) + '...' + address.substring(address.length - 10);
    }
    return address;
}

function formatAmount(amount) {
    return parseFloat(amount).toFixed(6);
}

function showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    // In a real implementation, show toast notification
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeQuantumSystem();
});