const QuantumGenesisApp = require('../src/index');
const { QuantumWallet } = require('../src/wallet/QuantumWallet');

describe('Quantum Blockchain Genesis', () => {
  let app;

  beforeAll(() => {
    app = new QuantumGenesisApp();
  });

  describe('Blockchain Core', () => {
    test('should initialize with genesis block', () => {
      expect(app.blockchain.chain.length).toBe(1);
      expect(app.blockchain.chain[0].index).toBe(0);
      expect(app.blockchain.genesisAddress).toBe('bc1qkm8plv5449r3t53dge6x6rmutk3wtkjlwczx8h');
    });

    test('should create valid transactions', () => {
      const wallet1 = new QuantumWallet();
      const wallet2 = new QuantumWallet();
      
      const transaction = wallet1.createTransaction(wallet2.address, 50);
      
      expect(transaction.fromAddress).toBe(wallet1.address);
      expect(transaction.toAddress).toBe(wallet2.address);
      expect(transaction.amount).toBe(50);
      expect(transaction.signature).toBeDefined();
    });

    test('should mine blocks successfully', () => {
      const wallet = new QuantumWallet();
      const initialLength = app.blockchain.chain.length;
      
      app.blockchain.minePendingTransactions(wallet.address);
      
      expect(app.blockchain.chain.length).toBe(initialLength + 1);
    });
  });

  describe('Bitcoin Bridge', () => {
    test('should initialize bridge with genesis address', async () => {
      await app.bitcoinBridge.initializeBridge();
      
      expect(app.bitcoinBridge.genesisAddress).toBe('bc1qkm8plv5449r3t53dge6x6rmutk3wtkjlwczx8h');
      expect(app.bitcoinBridge.bridgeContract).toBeDefined();
    });

    test('should validate Bitcoin address format', () => {
      const isValid = app.bitcoinBridge.isValidBech32Address('bc1qkm8plv5449r3t53dge6x6rmutk3wtkjlwczx8h');
      expect(isValid).toBe(true);
    });
  });

  describe('DeFi Protocol', () => {
    test('should create liquidity pools', () => {
      const poolId = app.defiProtocol.createLiquidityPool('TOKENA', 'TOKENB', 1000, 2000, 'creator_address');
      
      expect(poolId).toBeDefined();
      expect(app.defiProtocol.liquidityPools.has(poolId)).toBe(true);
    });

    test('should perform token swaps', () => {
      const poolId = app.defiProtocol.createLiquidityPool('TOKENA', 'TOKENB', 1000, 2000, 'creator_address');
      
      const result = app.defiProtocol.swap(poolId, 'TOKENA', 100, 150, 'trader_address');
      
      expect(result.amountOut).toBeGreaterThan(0);
      expect(result.fee).toBeGreaterThan(0);
    });
  });

  describe('Consensus Mechanism', () => {
    test('should register validators', () => {
      const validator = app.consensus.registerValidator('validator_address', 'public_key', 1500);
      
      expect(validator.address).toBe('validator_address');
      expect(validator.stake).toBe(1500);
      expect(validator.isActive).toBe(true);
    });

    test('should calculate voting power correctly', () => {
      app.consensus.registerValidator('validator1', 'pubkey1', 2000);
      const votingPower = app.consensus.calculateVotingPower('validator1');
      
      expect(votingPower).toBeGreaterThan(0);
    });
  });
});