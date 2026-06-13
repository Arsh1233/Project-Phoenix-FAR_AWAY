import hashlib
import json
from time import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MockBlockchain")

class Blockchain:
    def __init__(self):
        self.chain = []
        self.current_transactions = []
        # Create the genesis block
        self.new_block(previous_hash='1', proof=100)

    def new_block(self, proof, previous_hash=None):
        """
        Create a new Block in the Blockchain
        """
        block = {
            'index': len(self.chain) + 1,
            'timestamp': time(),
            'transactions': self.current_transactions,
            'proof': proof,
            'previous_hash': previous_hash or self.hash(self.chain[-1]),
        }
        # Reset the current list of transactions
        self.current_transactions = []
        self.chain.append(block)
        return block

    def new_transaction(self, candidate_id, fragment_id, center_id, timestamp=None):
        """
        Creates a new transaction to go into the next mined Block
        """
        if timestamp is None:
            timestamp = time()

        # Check for possible leak (Requirement 2)
        # We need to check recent transactions in the current pending list and the latest blocks.
        self._check_for_leaks(fragment_id, center_id, timestamp)

        transaction = {
            'candidate_id': candidate_id,
            'fragment_id': fragment_id,
            'center_id': center_id,
            'timestamp': timestamp,
        }
        self.current_transactions.append(transaction)
        
        # In a real blockchain we would wait to mine, but for this mock, 
        # we'll just automatically mine a block per transaction for simplicity of the audit log.
        return self.new_block(proof=12345) # dummy proof for mock

    def _check_for_leaks(self, fragment_id, center_id, timestamp):
        """
        Emits an alert if the same fragment is requested from two different locations within 5 seconds.
        """
        # Check current pending transactions
        all_txs = self.current_transactions.copy()
        # Check transactions in the chain (going backwards for recent ones)
        for block in reversed(self.chain):
            all_txs.extend(block['transactions'])
            
        for tx in all_txs:
            if tx['fragment_id'] == fragment_id:
                time_diff = abs(timestamp - tx['timestamp'])
                if time_diff <= 5.0 and tx['center_id'] != center_id:
                    logger.warning(
                        f"ALERT: Possible leak detected! Fragment {fragment_id} accessed from "
                        f"center {center_id} and center {tx['center_id']} within {time_diff:.2f} seconds."
                    )

    @staticmethod
    def hash(block):
        """
        Creates a SHA-256 hash of a Block
        """
        # We must make sure that the Dictionary is Ordered, or we'll have inconsistent hashes
        block_string = json.dumps(block, sort_keys=True).encode()
        return hashlib.sha256(block_string).hexdigest()

    @property
    def last_block(self):
        return self.chain[-1]

    def verify_chain(self):
        """
        Determine if a given blockchain is valid
        """
        last_block = self.chain[0]
        current_index = 1

        while current_index < len(self.chain):
            block = self.chain[current_index]
            print(f'Verifying block {block["index"]}')
            
            # Check that the hash of the block is correct
            if block['previous_hash'] != self.hash(last_block):
                return False

            last_block = block
            current_index += 1

        return True
