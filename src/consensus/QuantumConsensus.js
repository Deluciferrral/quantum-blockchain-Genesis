const crypto = require('crypto');
const { EventEmitter } = require('events');

/**
 * Quantum-resistant consensus mechanism for the Genesis blockchain
 * Implements a hybrid Proof-of-Stake with quantum-resistant cryptography
 */

class QuantumConsensus extends EventEmitter {
    constructor(blockchain) {
        super();
        this.blockchain = blockchain;
        this.validators = new Map();
        this.stakes = new Map();
        this.votingPower = new Map();
        this.currentEpoch = 0;
        this.epochDuration = 600000; // 10 minutes in milliseconds
        this.minimumStake = 1000;
        this.slashingRate = 0.1; // 10% slashing for malicious behavior
        this.rewardRate = 0.05; // 5% annual staking reward
        this.genesisValidator = 'bc1qkm8plv5449r3t53dge6x6rmutk3wtkjlwczx8h';
        this.quantumProofAlgorithm = 'CRYSTALS-Dilithium';
        this.lastEpochTime = Date.now();
        
        // Initialize genesis validator
        this.initializeGenesisValidator();
    }

    initializeGenesisValidator() {
        this.validators.set(this.genesisValidator, {
            address: this.genesisValidator,
            publicKey: this.generateQuantumPublicKey(),
            stake: 10000,
            isActive: true,
            reputation: 100,
            totalValidatedBlocks: 0,
            joinedEpoch: 0,
            quantumSignature: this.generateQuantumSignature()
        });

        this.stakes.set(this.genesisValidator, 10000);
        this.votingPower.set(this.genesisValidator, this.calculateVotingPower(this.genesisValidator));
        
        console.log(`Genesis validator initialized: ${this.genesisValidator}`);
    }

    generateQuantumPublicKey() {
        // Simulate quantum-resistant public key generation
        return crypto.createHash('sha3-256')
            .update(this.genesisValidator + 'quantum_key' + Date.now())
            .digest('hex');
    }

    generateQuantumSignature() {
        // Simulate quantum-resistant signature
        const signatureData = {
            algorithm: this.quantumProofAlgorithm,
            timestamp: Date.now(),
            randomness: crypto.randomBytes(32).toString('hex')
        };
        
        return crypto.createHash('sha3-512')
            .update(JSON.stringify(signatureData))
            .digest('hex');
    }

    // Validator management
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
            reputation: 50, // Start with neutral reputation
            totalValidatedBlocks: 0,
            joinedEpoch: this.currentEpoch,
            quantumSignature: this.generateQuantumSignature()
        };

        this.validators.set(address, validator);
        this.stakes.set(address, initialStake);
        this.votingPower.set(address, this.calculateVotingPower(address));

        this.emit('validatorRegistered', validator);
        console.log(`Validator registered: ${address}`);
        return validator;
    }

    addStake(validatorAddress, additionalStake, staker = null) {
        if (!this.validators.has(validatorAddress)) {
            throw new Error('Validator not found');
        }

        const currentStake = this.stakes.get(validatorAddress) || 0;
        const newStake = currentStake + additionalStake;

        this.stakes.set(validatorAddress, newStake);
        
        // Update validator's own stake if staker is the validator
        if (staker === validatorAddress || staker === null) {
            const validator = this.validators.get(validatorAddress);
            validator.stake = newStake;
        }

        // Recalculate voting power
        this.votingPower.set(validatorAddress, this.calculateVotingPower(validatorAddress));

        this.emit('stakeAdded', { validatorAddress, additionalStake, newStake });
        return newStake;
    }

    removeStake(validatorAddress, stakeToRemove, staker = null) {
        if (!this.validators.has(validatorAddress)) {
            throw new Error('Validator not found');
        }

        const currentStake = this.stakes.get(validatorAddress) || 0;
        if (stakeToRemove > currentStake) {
            throw new Error('Insufficient stake to remove');
        }

        const newStake = currentStake - stakeToRemove;
        
        // Check if remaining stake meets minimum requirement
        if (newStake < this.minimumStake && newStake > 0) {
            throw new Error('Remaining stake below minimum requirement');
        }

        this.stakes.set(validatorAddress, newStake);

        if (staker === validatorAddress || staker === null) {
            const validator = this.validators.get(validatorAddress);
            validator.stake = newStake;
            
            // Deactivate validator if stake is too low
            if (newStake < this.minimumStake) {
                validator.isActive = false;
            }
        }

        this.votingPower.set(validatorAddress, this.calculateVotingPower(validatorAddress));

        this.emit('stakeRemoved', { validatorAddress, stakeToRemove, newStake });
        return newStake;
    }

    calculateVotingPower(validatorAddress) {
        const validator = this.validators.get(validatorAddress);
        if (!validator || !validator.isActive) return 0;

        const stake = this.stakes.get(validatorAddress) || 0;
        const reputation = validator.reputation || 50;
        
        // Voting power based on stake and reputation
        // Reputation factor ranges from 0.5 to 1.5
        const reputationFactor = 0.5 + (reputation / 100);
        return stake * reputationFactor;
    }

    // Consensus mechanism
    selectValidators(blockHeight) {
        const activeValidators = Array.from(this.validators.values())
            .filter(v => v.isActive && (this.stakes.get(v.address) || 0) >= this.minimumStake);

        if (activeValidators.length === 0) {
            throw new Error('No active validators available');
        }

        const maxValidators = Math.min(activeValidators.length, 21); // Maximum 21 validators
        
        // If we need all or most validators, just return them sorted by power
        if (maxValidators >= activeValidators.length * 0.8) {
            return activeValidators
                .sort((a, b) => (this.votingPower.get(b.address) || 0) - (this.votingPower.get(a.address) || 0))
                .slice(0, maxValidators);
        }

        // Optimized weighted random selection without duplicates
        const selectedValidators = [];
        const selectedSet = new Set(); // Track selected addresses for O(1) duplicate check
        
        // Pre-calculate cumulative powers for binary search approach
        const validatorPowers = activeValidators.map(v => ({
            validator: v,
            power: this.votingPower.get(v.address) || 0
        }));
        
        const totalVotingPower = validatorPowers.reduce((sum, vp) => sum + vp.power, 0);

        // Select without replacement
        for (let i = 0; i < maxValidators && selectedValidators.length < maxValidators; i++) {
            let attempts = 0;
            const maxAttempts = activeValidators.length * 2;
            
            while (selectedValidators.length < maxValidators && attempts < maxAttempts) {
                attempts++;
                const randomValue = Math.random() * totalVotingPower;
                let cumulativePower = 0;

                for (const vp of validatorPowers) {
                    cumulativePower += vp.power;
                    
                    if (randomValue <= cumulativePower && !selectedSet.has(vp.validator.address)) {
                        selectedValidators.push(vp.validator);
                        selectedSet.add(vp.validator.address);
                        break;
                    }
                }
            }
        }

        return selectedValidators;
    }

    async validateBlock(block, validatorAddress) {
        const validator = this.validators.get(validatorAddress);
        if (!validator || !validator.isActive) {
            throw new Error('Invalid or inactive validator');
        }

        // Quantum-resistant block validation
        const isValid = await this.performQuantumValidation(block, validator);
        
        if (isValid) {
            // Update validator statistics
            validator.totalValidatedBlocks++;
            validator.reputation = Math.min(100, validator.reputation + 1);
            
            // Create validation proof
            const validationProof = {
                blockHash: block.hash,
                validatorAddress,
                timestamp: Date.now(),
                quantumSignature: this.generateQuantumSignature(),
                quantumProof: this.generateQuantumProof(block, validator)
            };

            this.emit('blockValidated', { block, validator, validationProof });
            return validationProof;
        } else {
            // Penalize validator for invalid validation
            validator.reputation = Math.max(0, validator.reputation - 5);
            throw new Error('Block validation failed');
        }
    }

    async performQuantumValidation(block, validator) {
        // Simulate quantum-resistant validation process
        // In production, this would use actual quantum-resistant algorithms
        
        const validationStart = Date.now();
        
        // Check block structure (early exit on failure)
        if (!block.hash || !block.previousHash || !block.timestamp) {
            return false;
        }

        // Verify quantum signature
        if (!block.data?.quantumProof) {
            return false;
        }

        // Verify transactions in the block
        const transactions = block.data?.transactions || [];
        for (const tx of transactions) {
            if (!this.validateTransaction(tx)) {
                return false;
            }
        }

        // Removed artificial 100ms delay for performance
        // In production, actual quantum validation computation would occur here

        const validationTime = Date.now() - validationStart;
        console.log(`Quantum validation completed in ${validationTime}ms by ${validator.address}`);

        return true;
    }

    validateTransaction(transaction) {
        // Basic transaction validation
        if (!transaction.fromAddress && !transaction.toAddress) return false;
        if (transaction.amount < 0) return false;
        
        // Verify quantum signature if present
        if (transaction.quantumProof) {
            return this.verifyQuantumSignature(transaction);
        }

        return true;
    }

    verifyQuantumSignature(transaction) {
        // Simulate quantum signature verification
        return transaction.quantumProof && transaction.quantumProof.length > 0;
    }

    generateQuantumProof(block, validator) {
        const proofData = {
            blockHash: block.hash,
            validatorAddress: validator.address,
            algorithm: this.quantumProofAlgorithm,
            timestamp: Date.now(),
            randomness: crypto.randomBytes(64).toString('hex')
        };

        return crypto.createHash('sha3-512')
            .update(JSON.stringify(proofData))
            .digest('hex');
    }

    // Epoch management
    checkEpochTransition() {
        const currentTime = Date.now();
        const timeSinceLastEpoch = currentTime - this.lastEpochTime;

        if (timeSinceLastEpoch >= this.epochDuration) {
            this.transitionToNextEpoch();
        }
    }

    transitionToNextEpoch() {
        const previousEpoch = this.currentEpoch;
        this.currentEpoch++;
        this.lastEpochTime = Date.now();

        // Distribute staking rewards
        this.distributeStakingRewards();

        // Update validator rankings
        this.updateValidatorRankings();

        this.emit('epochTransition', { previousEpoch, currentEpoch: this.currentEpoch });
        console.log(`Epoch transition: ${previousEpoch} -> ${this.currentEpoch}`);
    }

    distributeStakingRewards() {
        const epochDurationInYears = this.epochDuration / (1000 * 60 * 60 * 24 * 365);
        
        // Optimize: only iterate active validators with sufficient stake
        for (const [address, validator] of this.validators) {
            if (!validator.isActive) continue;
            
            const stake = this.stakes.get(address) || 0;
            if (stake < this.minimumStake) continue;
            
            const reward = stake * this.rewardRate * epochDurationInYears;
            
            // Add reward to stake
            this.addStake(address, reward);
            
            console.log(`Staking reward distributed to ${address}: ${reward}`);
        }
    }

    updateValidatorRankings() {
        const validators = Array.from(this.validators.values())
            .sort((a, b) => {
                const powerA = this.votingPower.get(a.address) || 0;
                const powerB = this.votingPower.get(b.address) || 0;
                return powerB - powerA;
            });

        console.log('Validator rankings updated:', validators.map(v => ({
            address: v.address,
            votingPower: this.votingPower.get(v.address),
            reputation: v.reputation
        })));
    }

    // Slashing mechanism
    slashValidator(validatorAddress, reason) {
        const validator = this.validators.get(validatorAddress);
        if (!validator) {
            throw new Error('Validator not found');
        }

        const currentStake = this.stakes.get(validatorAddress) || 0;
        const slashingAmount = currentStake * this.slashingRate;

        // Remove slashed stake
        this.removeStake(validatorAddress, slashingAmount);

        // Reduce reputation significantly
        validator.reputation = Math.max(0, validator.reputation - 20);

        // Deactivate if stake is too low
        if (this.stakes.get(validatorAddress) < this.minimumStake) {
            validator.isActive = false;
        }

        this.emit('validatorSlashed', { validatorAddress, slashingAmount, reason });
        console.log(`Validator ${validatorAddress} slashed: ${slashingAmount} tokens for ${reason}`);
    }

    // Governance
    createConsensusProposal(proposer, title, description, changes) {
        const proposalId = crypto.randomUUID();
        
        const proposal = {
            id: proposalId,
            proposer,
            title,
            description,
            changes,
            votes: new Map(),
            totalVotingPower: 0,
            votesFor: 0,
            votesAgainst: 0,
            createdAt: Date.now(),
            votingDeadline: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
            status: 'active',
            quantumSignature: this.generateQuantumSignature()
        };

        this.emit('proposalCreated', proposal);
        return proposal;
    }

    // Statistics and monitoring
    getConsensusStats() {
        const activeValidators = Array.from(this.validators.values())
            .filter(v => v.isActive);

        const totalStake = Array.from(this.stakes.values())
            .reduce((sum, stake) => sum + stake, 0);

        const totalVotingPower = Array.from(this.votingPower.values())
            .reduce((sum, power) => sum + power, 0);

        return {
            currentEpoch: this.currentEpoch,
            activeValidators: activeValidators.length,
            totalValidators: this.validators.size,
            totalStake,
            totalVotingPower,
            averageReputation: activeValidators.reduce((sum, v) => sum + v.reputation, 0) / activeValidators.length,
            genesisValidator: this.genesisValidator,
            quantumAlgorithm: this.quantumProofAlgorithm
        };
    }

    getValidatorInfo(address) {
        const validator = this.validators.get(address);
        if (!validator) return null;

        return {
            ...validator,
            currentStake: this.stakes.get(address) || 0,
            votingPower: this.votingPower.get(address) || 0
        };
    }
}

module.exports = { QuantumConsensus };