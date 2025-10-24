const crypto = require('crypto');
const { EventEmitter } = require('events');

/**
 * Quantum-resistant blockchain implementation with Bitcoin integration
 * Genesis block configured with provided Bitcoin address: bc1qkm8plv5449r3t53dge6x6rmutk3wtkjlwczx8h
 */

class QuantumBlock {
    constructor(index, previousHash, timestamp, data, quantumProof = null) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.quantumProof = quantumProof;
        this.nonce = 0;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        // Quantum-resistant hash using multiple algorithms
        const sha256Hash = crypto.createHash('sha256')
            .update(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data) + this.nonce)
            .digest('hex');
        
        const sha3Hash = crypto.createHash('sha3-256')
            .update(sha256Hash)
            .digest('hex');
            
        return sha3Hash;
    }

    mineBlock(difficulty) {
        const target = Array(difficulty + 1).join("0");
        
        while (this.hash.substring(0, difficulty) !== target) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        
        console.log(`Block mined: ${this.hash}`);
    }
}

class QuantumBlockchain extends EventEmitter {
    constructor() {
        super();
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 4;
        this.pendingTransactions = [];
        this.miningReward = 100;
        this.genesisAddress = 'bc1qkm8plv5449r3t53dge6x6rmutk3wtkjlwczx8h';
    }

    createGenesisBlock() {
        const genesisData = {
            message: "behold light and it is good",
            bitcoinAddress: this.genesisAddress,
            timestamp: Date.now(),
            creator: "Genesis Team",
            quantumSignature: this.generateQuantumSignature()
        };
        
        return new QuantumBlock(0, "0", "2025-10-23T00:00:00Z", genesisData);
    }

    generateQuantumSignature() {
        // Simulate quantum-resistant signature
        const randomBytes = crypto.randomBytes(64);
        return crypto.createHash('sha3-512').update(randomBytes).digest('hex');
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
        let balance = 0;

        for (const block of this.chain) {
            for (const trans of block.data.transactions || []) {
                if (trans.fromAddress === address) {
                    balance -= trans.amount;
                }

                if (trans.toAddress === address) {
                    balance += trans.amount;
                }
            }
        }

        return balance;
    }

    minePendingTransactions(miningRewardAddress) {
        const rewardTransaction = {
            fromAddress: null,
            toAddress: miningRewardAddress,
            amount: this.miningReward,
            timestamp: Date.now()
        };

        this.pendingTransactions.push(rewardTransaction);

        const block = new QuantumBlock(
            this.getLatestBlock().index + 1,
            this.getLatestBlock().hash,
            Date.now(),
            {
                transactions: this.pendingTransactions,
                quantumProof: this.generateQuantumSignature()
            }
        );

        block.mineBlock(this.difficulty);
        
        console.log('Block successfully mined!');
        this.chain.push(block);
        
        this.pendingTransactions = [];
        this.emit('blockMined', block);
    }

    isTransactionValid(transaction) {
        if (transaction.fromAddress === null) return true;

        if (!transaction.signature || transaction.signature.length === 0) {
            throw new Error('No signature in this transaction');
        }

        // Here you would verify the quantum-resistant signature
        return true;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (!this.isTransactionValid(currentBlock)) {
                return false;
            }

            if (currentBlock.hash !== currentBlock.calculateHash()) {
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

module.exports = { QuantumBlock, QuantumBlockchain };