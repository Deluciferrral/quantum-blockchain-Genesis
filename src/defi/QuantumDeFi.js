const crypto = require('crypto');
const { EventEmitter } = require('events');

/**
 * Quantum-resistant DeFi smart contracts for the Genesis blockchain
 */

class QuantumSmartContract extends EventEmitter {
    constructor(contractAddress, bytecode, abi) {
        super();
        this.contractAddress = contractAddress;
        this.bytecode = bytecode;
        this.abi = abi;
        this.state = {};
        this.events = [];
        this.createdAt = Date.now();
        this.quantumProof = this.generateQuantumProof();
    }

    generateQuantumProof() {
        return crypto.createHash('sha3-512')
            .update(this.contractAddress + this.bytecode + this.createdAt)
            .digest('hex');
    }

    execute(functionName, parameters, sender) {
        if (!this.abi[functionName]) {
            throw new Error(`Function ${functionName} not found in contract`);
        }

        const result = this.abi[functionName].call(this, parameters, sender);
        this.emit('executed', { functionName, parameters, result, sender });
        return result;
    }

    updateState(key, value) {
        this.state[key] = value;
        this.emit('stateUpdated', { key, value });
    }

    getState(key) {
        return this.state[key];
    }
}

class QuantumDeFiProtocol {
    constructor(blockchain) {
        this.blockchain = blockchain;
        this.liquidityPools = new Map();
        this.stakingPools = new Map();
        this.lendingPools = new Map();
        this.yieldFarms = new Map();
        this.protocolFee = 0.003; // 0.3%
        this.genesisAddress = 'bc1qkm8plv5449r3t53dge6x6rmutk3wtkjlwczx8h';
    }

    // Automated Market Maker (AMM) Functions
    createLiquidityPool(tokenA, tokenB, initialAmountA, initialAmountB, creator) {
        const poolId = crypto.createHash('sha256')
            .update(tokenA + tokenB + Date.now())
            .digest('hex');

        const pool = {
            id: poolId,
            tokenA,
            tokenB,
            reserveA: initialAmountA,
            reserveB: initialAmountB,
            totalLiquidity: Math.sqrt(initialAmountA * initialAmountB),
            creator,
            createdAt: Date.now(),
            lpTokens: new Map(),
            quantumSignature: this.generateQuantumSignature()
        };

        this.liquidityPools.set(poolId, pool);
        
        // Mint LP tokens to creator
        pool.lpTokens.set(creator, pool.totalLiquidity);

        return poolId;
    }

    addLiquidity(poolId, amountA, amountB, provider) {
        const pool = this.liquidityPools.get(poolId);
        if (!pool) throw new Error('Pool not found');

        const optimalAmountB = (amountA * pool.reserveB) / pool.reserveA;
        const optimalAmountA = (amountB * pool.reserveA) / pool.reserveB;

        let finalAmountA, finalAmountB;
        
        if (optimalAmountB <= amountB) {
            finalAmountA = amountA;
            finalAmountB = optimalAmountB;
        } else {
            finalAmountA = optimalAmountA;
            finalAmountB = amountB;
        }

        const liquidityMinted = Math.min(
            (finalAmountA * pool.totalLiquidity) / pool.reserveA,
            (finalAmountB * pool.totalLiquidity) / pool.reserveB
        );

        pool.reserveA += finalAmountA;
        pool.reserveB += finalAmountB;
        pool.totalLiquidity += liquidityMinted;

        const currentLp = pool.lpTokens.get(provider) || 0;
        pool.lpTokens.set(provider, currentLp + liquidityMinted);

        return { liquidityMinted, amountA: finalAmountA, amountB: finalAmountB };
    }

    removeLiquidity(poolId, liquidityAmount, provider) {
        const pool = this.liquidityPools.get(poolId);
        if (!pool) throw new Error('Pool not found');

        const providerLiquidity = pool.lpTokens.get(provider) || 0;
        if (providerLiquidity < liquidityAmount) {
            throw new Error('Insufficient liquidity tokens');
        }

        const amountA = (liquidityAmount * pool.reserveA) / pool.totalLiquidity;
        const amountB = (liquidityAmount * pool.reserveB) / pool.totalLiquidity;

        pool.reserveA -= amountA;
        pool.reserveB -= amountB;
        pool.totalLiquidity -= liquidityAmount;
        pool.lpTokens.set(provider, providerLiquidity - liquidityAmount);

        return { amountA, amountB };
    }

    swap(poolId, tokenIn, amountIn, minAmountOut, trader) {
        const pool = this.liquidityPools.get(poolId);
        if (!pool) throw new Error('Pool not found');

        let reserveIn, reserveOut, amountOut;
        
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
        amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);

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

    // Staking Functions
    createStakingPool(stakingToken, rewardToken, rewardRate, creator) {
        const poolId = crypto.createHash('sha256')
            .update(stakingToken + rewardToken + Date.now())
            .digest('hex');

        const pool = {
            id: poolId,
            stakingToken,
            rewardToken,
            rewardRate, // rewards per second
            totalStaked: 0,
            totalRewards: 0,
            lastUpdateTime: Date.now(),
            rewardPerTokenStored: 0,
            stakers: new Map(),
            creator,
            quantumSignature: this.generateQuantumSignature()
        };

        this.stakingPools.set(poolId, pool);
        return poolId;
    }

    stake(poolId, amount, staker) {
        const pool = this.stakingPools.get(poolId);
        if (!pool) throw new Error('Staking pool not found');

        this.updateRewards(pool);

        const stakerInfo = pool.stakers.get(staker) || {
            stakedAmount: 0,
            rewardPerTokenPaid: 0,
            rewards: 0
        };

        if (stakerInfo.stakedAmount > 0) {
            stakerInfo.rewards += this.earned(pool, staker);
        }

        stakerInfo.stakedAmount += amount;
        stakerInfo.rewardPerTokenPaid = pool.rewardPerTokenStored;
        pool.totalStaked += amount;

        pool.stakers.set(staker, stakerInfo);
        return stakerInfo;
    }

    unstake(poolId, amount, staker) {
        const pool = this.stakingPools.get(poolId);
        if (!pool) throw new Error('Staking pool not found');

        const stakerInfo = pool.stakers.get(staker);
        if (!stakerInfo || stakerInfo.stakedAmount < amount) {
            throw new Error('Insufficient staked amount');
        }

        this.updateRewards(pool);

        stakerInfo.rewards += this.earned(pool, staker);
        stakerInfo.stakedAmount -= amount;
        stakerInfo.rewardPerTokenPaid = pool.rewardPerTokenStored;
        pool.totalStaked -= amount;

        return stakerInfo;
    }

    claimRewards(poolId, staker) {
        const pool = this.stakingPools.get(poolId);
        if (!pool) throw new Error('Staking pool not found');

        this.updateRewards(pool);

        const stakerInfo = pool.stakers.get(staker);
        if (!stakerInfo) throw new Error('No staking found');

        const rewards = this.earned(pool, staker);
        stakerInfo.rewards = 0;
        stakerInfo.rewardPerTokenPaid = pool.rewardPerTokenStored;

        return rewards;
    }

    updateRewards(pool) {
        const now = Date.now();
        if (pool.totalStaked > 0) {
            const timeDiff = (now - pool.lastUpdateTime) / 1000; // seconds
            pool.rewardPerTokenStored += (pool.rewardRate * timeDiff) / pool.totalStaked;
        }
        pool.lastUpdateTime = now;
    }

    earned(pool, staker) {
        const stakerInfo = pool.stakers.get(staker);
        if (!stakerInfo) return 0;

        return (stakerInfo.stakedAmount * 
                (pool.rewardPerTokenStored - stakerInfo.rewardPerTokenPaid)) + 
                stakerInfo.rewards;
    }

    // Lending Protocol Functions
    createLendingPool(asset, interestRate, collateralRatio, creator) {
        const poolId = crypto.createHash('sha256')
            .update(asset + Date.now())
            .digest('hex');

        const pool = {
            id: poolId,
            asset,
            interestRate, // annual percentage rate
            collateralRatio, // required collateral ratio (e.g., 150%)
            totalSupply: 0,
            totalBorrows: 0,
            lenders: new Map(),
            borrowers: new Map(),
            creator,
            quantumSignature: this.generateQuantumSignature()
        };

        this.lendingPools.set(poolId, pool);
        return poolId;
    }

    supply(poolId, amount, supplier) {
        const pool = this.lendingPools.get(poolId);
        if (!pool) throw new Error('Lending pool not found');

        const supplierInfo = pool.lenders.get(supplier) || { supplied: 0, earned: 0 };
        supplierInfo.supplied += amount;
        pool.totalSupply += amount;

        pool.lenders.set(supplier, supplierInfo);
        return supplierInfo;
    }

    borrow(poolId, amount, collateralAmount, borrower) {
        const pool = this.lendingPools.get(poolId);
        if (!pool) throw new Error('Lending pool not found');

        const requiredCollateral = amount * (pool.collateralRatio / 100);
        if (collateralAmount < requiredCollateral) {
            throw new Error('Insufficient collateral');
        }

        if (amount > pool.totalSupply - pool.totalBorrows) {
            throw new Error('Insufficient liquidity');
        }

        const borrowerInfo = pool.borrowers.get(borrower) || {
            borrowed: 0,
            collateral: 0,
            lastBorrowTime: Date.now()
        };

        borrowerInfo.borrowed += amount;
        borrowerInfo.collateral += collateralAmount;
        borrowerInfo.lastBorrowTime = Date.now();
        pool.totalBorrows += amount;

        pool.borrowers.set(borrower, borrowerInfo);
        return borrowerInfo;
    }

    repay(poolId, amount, borrower) {
        const pool = this.lendingPools.get(poolId);
        if (!pool) throw new Error('Lending pool not found');

        const borrowerInfo = pool.borrowers.get(borrower);
        if (!borrowerInfo || borrowerInfo.borrowed < amount) {
            throw new Error('Invalid repayment amount');
        }

        borrowerInfo.borrowed -= amount;
        pool.totalBorrows -= amount;

        // Calculate collateral to return
        const collateralToReturn = (amount / (borrowerInfo.borrowed + amount)) * borrowerInfo.collateral;
        borrowerInfo.collateral -= collateralToReturn;

        return { repaidAmount: amount, collateralReturned: collateralToReturn };
    }

    generateQuantumSignature() {
        const randomBytes = crypto.randomBytes(64);
        return crypto.createHash('sha3-512').update(randomBytes).digest('hex');
    }

    // Governance functions
    createProposal(title, description, proposer) {
        const proposalId = crypto.createHash('sha256')
            .update(title + description + Date.now())
            .digest('hex');

        return {
            id: proposalId,
            title,
            description,
            proposer,
            votesFor: 0,
            votesAgainst: 0,
            voters: new Set(),
            createdAt: Date.now(),
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
            quantumSignature: this.generateQuantumSignature()
        };
    }
}

module.exports = { QuantumSmartContract, QuantumDeFiProtocol };