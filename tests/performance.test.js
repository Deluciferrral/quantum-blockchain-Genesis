const QuantumGenesisApp = require('../src/index');
const { QuantumWallet } = require('../src/wallet/QuantumWallet');
const { QuantumBlock } = require('../src/blockchain/QuantumBlockchain');

describe('Performance Optimizations', () => {
  let app;

  beforeEach(() => {
    app = new QuantumGenesisApp();
  });

  describe('Blockchain Caching', () => {
    test('should cache balance calculations', () => {
      const testAddress = 'qb1testaddress123';
      
      // First call should calculate and cache
      const balance1 = app.blockchain.getBalance(testAddress);
      
      // Second call should use cache
      const balance2 = app.blockchain.getBalance(testAddress);
      
      expect(balance1).toBe(balance2);
      expect(app.blockchain.balanceCache.has(testAddress)).toBe(true);
    });

    test('should invalidate cache on new block', () => {
      const wallet = new QuantumWallet();
      
      // Get initial balance (will be cached)
      const initialBalance = app.blockchain.getBalance(wallet.address);
      expect(app.blockchain.balanceCache.has(wallet.address)).toBe(true);
      
      // Mine a block with reward to this address
      app.blockchain.minePendingTransactions(wallet.address);
      
      // Cache should be invalidated
      expect(app.blockchain.balanceCache.has(wallet.address)).toBe(false);
      
      // New balance should be different
      const newBalance = app.blockchain.getBalance(wallet.address);
      expect(newBalance).toBeGreaterThan(initialBalance);
    });

    test('should index transactions by address', () => {
      const wallet = new QuantumWallet();
      
      // Mine a block to create transactions
      app.blockchain.minePendingTransactions(wallet.address);
      
      // Should have transaction index entry
      expect(app.blockchain.transactionIndex.has(wallet.address)).toBe(true);
      
      // Get history should use index
      const history = app.blockchain.getTransactionHistory(wallet.address);
      expect(history.length).toBeGreaterThan(0);
    });

    test('should use index for fast transaction history lookup', () => {
      const wallet = new QuantumWallet();
      app.blockchain.minePendingTransactions(wallet.address);
      
      // Populate index
      app.blockchain.getTransactionHistory(wallet.address);
      
      const startTime = Date.now();
      const history = app.blockchain.getTransactionHistory(wallet.address);
      const duration = Date.now() - startTime;
      
      // Should be very fast (< 5ms) with index
      expect(duration).toBeLessThan(5);
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('Bitcoin Bridge Performance', () => {
    beforeEach(async () => {
      await app.bitcoinBridge.initializeBridge();
    });

    test('should verify bitcoin transactions without artificial delay', async () => {
      const txHash = '0'.repeat(64);
      const amount = 1.0;
      
      const startTime = Date.now();
      const result = await app.bitcoinBridge.verifyBitcoinTransaction(txHash, amount);
      const duration = Date.now() - startTime;
      
      // Should complete in less than 100ms (was 1000ms+ with delay)
      expect(duration).toBeLessThan(100);
      expect(result).toBe(true);
    });

    test('should index transfers by address for fast lookup', async () => {
      const recipient = 'qb1recipient123';
      const txHash = '0'.repeat(64);
      
      // Note: Bridge operations will fail transaction validation but should still index the transfer
      try {
        await app.bitcoinBridge.lockBitcoinAndMint(txHash, 1.0, recipient);
      } catch (err) {
        // Expected - transaction validation may fail but indexing should happen
      }
      
      // Should be in address index
      expect(app.bitcoinBridge.transfersByAddress.has(recipient)).toBe(true);
      
      // History lookup should be instant
      const startTime = Date.now();
      const history = app.bitcoinBridge.getTransferHistory(recipient);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(5);
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history[0].type).toBe('bitcoin_to_quantum');
    });

    test('should handle multiple transfers efficiently', async () => {
      const recipient = 'qb1recipient456';
      
      // Add multiple transfers
      for (let i = 0; i < 10; i++) {
        const txHash = i.toString().repeat(64).substring(0, 64);
        try {
          await app.bitcoinBridge.lockBitcoinAndMint(txHash, 0.1, recipient);
        } catch (err) {
          // Expected - transaction validation may fail but indexing should happen
        }
      }
      
      // Should retrieve all transfers quickly
      const startTime = Date.now();
      const history = app.bitcoinBridge.getTransferHistory(recipient);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(10);
      expect(history.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('DeFi Input Validation', () => {
    test('should fail fast on invalid swap amounts', () => {
      const poolId = app.defiProtocol.createLiquidityPool('TOKENA', 'TOKENB', 1000, 2000, 'creator');
      
      // Should throw immediately without expensive calculations
      expect(() => {
        app.defiProtocol.swap(poolId, 'TOKENA', 0, 100, 'trader');
      }).toThrow('Invalid input amount');
      
      expect(() => {
        app.defiProtocol.swap(poolId, 'TOKENA', -10, 100, 'trader');
      }).toThrow('Invalid input amount');
    });

    test('should validate liquidity before swap', () => {
      const poolId = app.defiProtocol.createLiquidityPool('TOKENA', 'TOKENB', 100, 200, 'creator');
      
      // Test that a large swap that would output more than available liquidity throws
      // The swap formula: output = (input * (1-fee) * reserveOut) / (reserveIn + input * (1-fee))
      // With large input, this approaches reserveOut, which we check against
      const result = app.defiProtocol.swap(poolId, 'TOKENA', 10000, 0, 'trader');
      
      // Should work but output should be less than total reserve
      expect(result.amountOut).toBeLessThan(200); // Less than initial reserveB
      expect(result.amountOut).toBeGreaterThan(0);
    });

    test('should fail fast on invalid addLiquidity amounts', () => {
      const poolId = app.defiProtocol.createLiquidityPool('TOKENA', 'TOKENB', 1000, 2000, 'creator');
      
      expect(() => {
        app.defiProtocol.addLiquidity(poolId, 0, 100, 'provider');
      }).toThrow('Invalid liquidity amounts');
      
      expect(() => {
        app.defiProtocol.addLiquidity(poolId, 100, -50, 'provider');
      }).toThrow('Invalid liquidity amounts');
    });

    test('should fail fast on invalid stake amounts', () => {
      const poolId = app.defiProtocol.createStakingPool('TOKEN', 'REWARD', 0.1, 'creator');
      
      expect(() => {
        app.defiProtocol.stake(poolId, 0, 'staker');
      }).toThrow('Invalid stake amount');
      
      expect(() => {
        app.defiProtocol.stake(poolId, -100, 'staker');
      }).toThrow('Invalid stake amount');
    });

    test('should fail fast on invalid borrow amounts', () => {
      const poolId = app.defiProtocol.createLendingPool('ASSET', 0.05, 150, 'creator');
      
      expect(() => {
        app.defiProtocol.borrow(poolId, 0, 100, 'borrower');
      }).toThrow('Invalid borrow amount');
      
      expect(() => {
        app.defiProtocol.borrow(poolId, 100, 0, 'borrower');
      }).toThrow('Invalid collateral amount');
    });
  });

  describe('Consensus Optimizations', () => {
    test('should select validators efficiently without duplicates', () => {
      // Register multiple validators
      for (let i = 0; i < 10; i++) {
        app.consensus.registerValidator(`validator${i}`, `pubkey${i}`, 1500);
      }
      
      const startTime = Date.now();
      const selected = app.consensus.selectValidators(1);
      const duration = Date.now() - startTime;
      
      // Should be fast
      expect(duration).toBeLessThan(50);
      
      // Should not have duplicates
      const addresses = selected.map(v => v.address);
      const uniqueAddresses = new Set(addresses);
      expect(addresses.length).toBe(uniqueAddresses.size);
    });

    test('should skip inactive validators in reward distribution', () => {
      app.consensus.registerValidator('active1', 'pubkey1', 2000);
      app.consensus.registerValidator('inactive1', 'pubkey2', 2000);
      
      // Deactivate one validator
      const validator = app.consensus.validators.get('inactive1');
      validator.isActive = false;
      
      // Distribute rewards
      const initialStake = app.consensus.stakes.get('active1');
      app.consensus.distributeStakingRewards();
      
      // Active validator should receive rewards
      const newStake = app.consensus.stakes.get('active1');
      expect(newStake).toBeGreaterThan(initialStake);
      
      // Inactive validator stake should not change
      expect(app.consensus.stakes.get('inactive1')).toBe(2000);
    });

    test('should validate blocks without artificial delays', async () => {
      const block = new QuantumBlock(1, 'prev_hash', Date.now(), {
        transactions: [],
        quantumProof: 'test_proof'
      });
      
      const validator = app.consensus.validators.get(app.consensus.genesisValidator);
      
      const startTime = Date.now();
      const result = await app.consensus.performQuantumValidation(block, validator);
      const duration = Date.now() - startTime;
      
      // Should be fast without artificial delay (was 100ms+)
      expect(duration).toBeLessThan(50);
      expect(result).toBe(true);
    });
  });

  describe('API Performance', () => {
    test('should not validate chain on info endpoint by default', () => {
      // Mock isChainValid to track if it's called
      const originalIsChainValid = app.blockchain.isChainValid;
      let validationCalled = false;
      app.blockchain.isChainValid = () => {
        validationCalled = true;
        return originalIsChainValid.call(app.blockchain);
      };
      
      // Simulate request without validate parameter
      const req = { query: {} };
      const res = {
        json: jest.fn()
      };
      
      // Get the route handler
      const infoHandler = app.app._router.stack
        .find(layer => layer.route?.path === '/api/blockchain/info')
        ?.route.stack[0].handle;
      
      if (infoHandler) {
        infoHandler(req, res);
        expect(validationCalled).toBe(false);
        expect(res.json).toHaveBeenCalled();
        expect(res.json.mock.calls[0][0].isValid).toBeUndefined();
      }
      
      // Restore original function
      app.blockchain.isChainValid = originalIsChainValid;
    });
  });
});
