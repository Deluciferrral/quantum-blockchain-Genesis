import hashlib
import time
import random

class QuantumBlock:
    def __init__(self, index, previous_hash, timestamp, data, nonce=0):
        self.index = index
        self.previous_hash = previous_hash
        self.timestamp = timestamp
        self.data = data
        self.nonce = nonce
        self.hash = self.calculate_hash()

    def calculate_hash(self):
        # Simulate a quantum-resistant hash expansion
        # Uses multiple hash rounds with SHA-256 to simulate quantum resistance
        block_string = f"{self.index}{self.previous_hash}{self.timestamp}{self.data}{self.nonce}"
        
        # First round: SHA-256
        hash_result = hashlib.sha256(block_string.encode()).hexdigest()
        
        # Second round: Add quantum simulation factor
        # Simulate lattice-based cryptography by using multiple hash iterations
        for i in range(3):
            hash_result = hashlib.sha256((hash_result + str(i)).encode()).hexdigest()
        
        return hash_result

    def __repr__(self):
        return f"Block(index={self.index}, hash={self.hash[:16]}..., previous_hash={self.previous_hash[:16]}...)"


class QuantumBlockchain:
    def __init__(self):
        self.chain = []
        self.difficulty = 4  # Number of leading zeros required in hash
        self.create_genesis_block()

    def create_genesis_block(self):
        """Create the first block in the blockchain"""
        genesis_block = QuantumBlock(0, "0", time.time(), "Genesis Block")
        self.chain.append(genesis_block)
        return genesis_block

    def get_latest_block(self):
        """Get the most recent block in the chain"""
        return self.chain[-1]

    def add_block(self, data):
        """Add a new block to the blockchain"""
        previous_block = self.get_latest_block()
        new_index = previous_block.index + 1
        new_timestamp = time.time()
        new_block = QuantumBlock(new_index, previous_block.hash, new_timestamp, data)
        
        # Mine the block to find a valid hash
        new_block = self.mine_block(new_block)
        self.chain.append(new_block)
        return new_block

    def mine_block(self, block):
        """Mine a block by finding a hash with required difficulty"""
        target = "0" * self.difficulty
        
        while block.hash[:self.difficulty] != target:
            block.nonce += 1
            block.hash = block.calculate_hash()
        
        print(f"Block mined: {block.hash}")
        return block

    def is_chain_valid(self):
        """Verify the integrity of the blockchain"""
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]

            # Check if current block's hash is valid
            if current_block.hash != current_block.calculate_hash():
                print(f"Invalid hash at block {i}")
                return False

            # Check if previous hash matches
            if current_block.previous_hash != previous_block.hash:
                print(f"Invalid previous hash at block {i}")
                return False

            # Check if block meets difficulty requirement
            if current_block.hash[:self.difficulty] != "0" * self.difficulty:
                print(f"Block {i} doesn't meet difficulty requirement")
                return False

        return True

    def display_chain(self):
        """Display all blocks in the blockchain"""
        for block in self.chain:
            print(f"\nBlock #{block.index}")
            print(f"Timestamp: {block.timestamp}")
            print(f"Data: {block.data}")
            print(f"Nonce: {block.nonce}")
            print(f"Hash: {block.hash}")
            print(f"Previous Hash: {block.previous_hash}")
            print("-" * 80)


def main():
    """Demonstrate the quantum blockchain"""
    print("=" * 80)
    print("Quantum-Resistant Bitcoin Blockchain Demo")
    print("=" * 80)
    
    # Create blockchain
    blockchain = QuantumBlockchain()
    print("\n✓ Genesis block created")
    
    # Add some blocks
    print("\n--- Mining Block 1 ---")
    blockchain.add_block("Transaction: Alice -> Bob: 10 BTC")
    
    print("\n--- Mining Block 2 ---")
    blockchain.add_block("Transaction: Bob -> Charlie: 5 BTC")
    
    print("\n--- Mining Block 3 ---")
    blockchain.add_block("Transaction: Charlie -> Alice: 2 BTC")
    
    # Display the blockchain
    print("\n" + "=" * 80)
    print("Complete Blockchain:")
    print("=" * 80)
    blockchain.display_chain()
    
    # Validate the blockchain
    print("\n" + "=" * 80)
    print("Blockchain Validation:")
    print("=" * 80)
    is_valid = blockchain.is_chain_valid()
    print(f"\nBlockchain is valid: {is_valid}")
    
    # Demonstrate tampering detection
    print("\n" + "=" * 80)
    print("Tampering Detection Test:")
    print("=" * 80)
    print("Attempting to tamper with block 1...")
    blockchain.chain[1].data = "Transaction: Alice -> Bob: 100 BTC (tampered)"
    is_valid_after_tampering = blockchain.is_chain_valid()
    print(f"Blockchain is valid after tampering: {is_valid_after_tampering}")


if __name__ == "__main__":
    main()
