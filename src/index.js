const express = require('express');
const cors = require('cors');
const path = require('path');
const { QuantumBlockchain } = require('./blockchain/QuantumBlockchain');
const { QuantumTransaction, QuantumWallet } = require('./wallet/QuantumWallet');
const { QuantumDeFiProtocol } = require('./defi/QuantumDeFi');
const { BitcoinQuantumBridge } = require('./bitcoin/BitcoinBridge');
const { QuantumConsensus } = require('./consensus/QuantumConsensus');

/**
 * Quantum Blockchain Genesis - Main Application
 * Genesis Bitcoin Address: bc1qkm8plv5449r3t53dge6x6rmutk3wtkjlwczx8h
 */

class QuantumGenesisApp {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        
        // Initialize blockchain components
        this.blockchain = new QuantumBlockchain();
        this.consensus = new QuantumConsensus(this.blockchain);
        this.defiProtocol = new QuantumDeFiProtocol(this.blockchain);
        this.bitcoinBridge = new BitcoinQuantumBridge(this.blockchain);
        
        // Initialize wallets storage
        this.wallets = new Map();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.initializeSystem();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../public')));
    }

    setupRoutes() {
        // Blockchain routes
        this.app.get('/api/blockchain/info', (req, res) => {
            // Only validate chain if explicitly requested to avoid performance hit
            const shouldValidate = req.query.validate === 'true';
            res.json({
                chainLength: this.blockchain.chain.length,
                difficulty: this.blockchain.difficulty,
                genesisAddress: this.blockchain.genesisAddress,
                pendingTransactions: this.blockchain.pendingTransactions.length,
                isValid: shouldValidate ? this.blockchain.isChainValid() : undefined
            });
        });

        this.app.get('/api/blockchain/blocks', (req, res) => {
            res.json(this.blockchain.chain);
        });

        this.app.get('/api/blockchain/block/:index', (req, res) => {
            const index = parseInt(req.params.index);
            const block = this.blockchain.chain[index];
            
            if (block) {
                res.json(block);
            } else {
                res.status(404).json({ error: 'Block not found' });
            }
        });

        // Wallet routes
        this.app.post('/api/wallet/create', (req, res) => {
            try {
                const wallet = new QuantumWallet();
                this.wallets.set(wallet.address, wallet);
                
                res.json({
                    address: wallet.address,
                    publicKey: wallet.publicKey,
                    balance: wallet.getBalance(this.blockchain)
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/wallet/:address/balance', (req, res) => {
            try {
                const balance = this.blockchain.getBalance(req.params.address);
                res.json({ address: req.params.address, balance });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/wallet/:address/transactions', (req, res) => {
            try {
                const transactions = this.blockchain.getTransactionHistory(req.params.address);
                res.json(transactions);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Transaction routes
        this.app.post('/api/transaction/create', (req, res) => {
            try {
                const { fromAddress, toAddress, amount } = req.body;
                
                const wallet = this.wallets.get(fromAddress);
                if (!wallet) {
                    return res.status(400).json({ error: 'Wallet not found' });
                }

                const transaction = wallet.createTransaction(toAddress, amount);
                this.blockchain.addTransaction(transaction);
                
                res.json({
                    success: true,
                    transactionHash: transaction.txHash,
                    message: 'Transaction added to pending pool'
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/blockchain/mine', (req, res) => {
            try {
                const { minerAddress } = req.body;
                
                this.blockchain.minePendingTransactions(minerAddress);
                
                res.json({
                    success: true,
                    message: 'Block mined successfully',
                    blockCount: this.blockchain.chain.length
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // DeFi routes
        this.app.post('/api/defi/pool/create', (req, res) => {
            try {
                const { tokenA, tokenB, amountA, amountB, creator } = req.body;
                
                const poolId = this.defiProtocol.createLiquidityPool(
                    tokenA, tokenB, amountA, amountB, creator
                );
                
                res.json({ success: true, poolId });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/defi/swap', (req, res) => {
            try {
                const { poolId, tokenIn, amountIn, minAmountOut, trader } = req.body;
                
                const result = this.defiProtocol.swap(
                    poolId, tokenIn, amountIn, minAmountOut, trader
                );
                
                res.json({ success: true, ...result });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/defi/pools', (req, res) => {
            const pools = Array.from(this.defiProtocol.liquidityPools.entries()).map(([id, pool]) => ({
                id,
                ...pool
            }));
            
            res.json(pools);
        });

        // Bitcoin bridge routes
        this.app.post('/api/bridge/lock-bitcoin', (req, res) => {
            try {
                const { bitcoinTxHash, amount, quantumRecipient } = req.body;
                
                this.bitcoinBridge.lockBitcoinAndMint(bitcoinTxHash, amount, quantumRecipient)
                    .then(result => res.json({ success: true, ...result }))
                    .catch(error => res.status(500).json({ error: error.message }));
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/bridge/burn-quantum', (req, res) => {
            try {
                const { quantumSender, amount, bitcoinRecipient } = req.body;
                
                this.bitcoinBridge.burnQuantumAndUnlock(quantumSender, amount, bitcoinRecipient)
                    .then(result => res.json({ success: true, ...result }))
                    .catch(error => res.status(500).json({ error: error.message }));
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/bridge/stats', (req, res) => {
            res.json(this.bitcoinBridge.getBridgeStats());
        });

        // Consensus routes
        this.app.get('/api/consensus/stats', (req, res) => {
            res.json(this.consensus.getConsensusStats());
        });

        this.app.get('/api/consensus/validators', (req, res) => {
            const validators = Array.from(this.consensus.validators.values());
            res.json(validators);
        });

        this.app.post('/api/consensus/register-validator', (req, res) => {
            try {
                const { address, publicKey, initialStake } = req.body;
                
                const validator = this.consensus.registerValidator(address, publicKey, initialStake);
                res.json({ success: true, validator });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                blockchain: {
                    blocks: this.blockchain.chain.length,
                    pending: this.blockchain.pendingTransactions.length
                },
                consensus: {
                    epoch: this.consensus.currentEpoch,
                    validators: this.consensus.validators.size
                },
                bridge: {
                    totalLocked: this.bitcoinBridge.getBridgeStats().totalLocked,
                    totalMinted: this.bitcoinBridge.getBridgeStats().totalMinted
                }
            });
        });

        // Serve frontend
        this.app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/index.html'));
        });
    }

    async initializeSystem() {
        try {
            console.log('🚀 Initializing Quantum Blockchain Genesis...');
            
            // Initialize Bitcoin bridge
            await this.bitcoinBridge.initializeBridge();
            
            // Set up event listeners
            this.setupEventListeners();
            
            console.log('✅ System initialized successfully');
            console.log(`📍 Genesis Bitcoin Address: ${this.blockchain.genesisAddress}`);
            console.log(`🔗 Bridge Contract: ${this.bitcoinBridge.bridgeContract?.address}`);
            
        } catch (error) {
            console.error('❌ System initialization failed:', error);
        }
    }

    setupEventListeners() {
        // Blockchain events
        this.blockchain.on('blockMined', (block) => {
            console.log(`⛏️  Block mined: ${block.hash}`);
        });

        // Consensus events
        this.consensus.on('epochTransition', (data) => {
            console.log(`🔄 Epoch transition: ${data.previousEpoch} -> ${data.currentEpoch}`);
        });

        this.consensus.on('validatorRegistered', (validator) => {
            console.log(`👥 New validator registered: ${validator.address}`);
        });

        // Bridge events would go here
        // DeFi events would go here
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`🌐 Quantum Blockchain Genesis running on port ${this.port}`);
            console.log(`📱 Web interface: http://localhost:${this.port}`);
            console.log(`🔌 API endpoint: http://localhost:${this.port}/api`);
            console.log(`\n🎯 Genesis Address: ${this.blockchain.genesisAddress}`);
            console.log('💡 "behold light and it is good"');
        });
    }

    // Utility methods
    createGenesisWallet() {
        const wallet = new QuantumWallet();
        this.wallets.set(wallet.address, wallet);
        return wallet;
    }

    async performDemoOperations() {
        console.log('\n🎪 Running demo operations...');
        
        try {
            // Create demo wallets
            const wallet1 = this.createGenesisWallet();
            const wallet2 = this.createGenesisWallet();
            
            console.log(`👤 Demo wallet 1: ${wallet1.address}`);
            console.log(`👤 Demo wallet 2: ${wallet2.address}`);
            
            // Mine some blocks to give wallets funds
            this.blockchain.minePendingTransactions(wallet1.address);
            this.blockchain.minePendingTransactions(wallet2.address);
            
            console.log(`💰 Wallet 1 balance: ${this.blockchain.getBalance(wallet1.address)}`);
            console.log(`💰 Wallet 2 balance: ${this.blockchain.getBalance(wallet2.address)}`);
            
            // Create a transaction
            const transaction = wallet1.createTransaction(wallet2.address, 50);
            this.blockchain.addTransaction(transaction);
            
            // Mine the transaction
            this.blockchain.minePendingTransactions(wallet1.address);
            
            console.log(`✅ Transaction completed`);
            console.log(`💰 Wallet 1 balance: ${this.blockchain.getBalance(wallet1.address)}`);
            console.log(`💰 Wallet 2 balance: ${this.blockchain.getBalance(wallet2.address)}`);
            
        } catch (error) {
            console.error('❌ Demo operations failed:', error);
        }
    }
}

// Start the application
if (require.main === module) {
    const app = new QuantumGenesisApp();
    app.start();
    
    // Run demo operations after startup
    setTimeout(() => {
        app.performDemoOperations();
    }, 2000);
}

module.exports = QuantumGenesisApp;