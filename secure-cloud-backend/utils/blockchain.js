const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class Block {
  constructor(index, timestamp, data, previousHash = '', hash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data; // file metadata or event data
    this.previousHash = previousHash;
    this.hash = hash || this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(
        this.index +
        this.timestamp +
        JSON.stringify(this.data) +
        this.previousHash
      )
      .digest('hex');
  }
}

class Blockchain {
  constructor() {
    this.storagePath = path.resolve(__dirname, '../data/blockchain_data.json');
    this.ensureStorageDir();
    this.chain = this.loadChain();
  }

  ensureStorageDir() {
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  createGenesisBlock() {
    return new Block(0, new Date().toISOString(), "Genesis Block", "0");
  }

  loadChain() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const fileContent = fs.readFileSync(this.storagePath, 'utf8');
        const rawChain = JSON.parse(fileContent);
        if (Array.isArray(rawChain) && rawChain.length > 0) {
          // Reconstitute into Block instances
          return rawChain.map(
            (b) => new Block(b.index, b.timestamp, b.data, b.previousHash, b.hash)
          );
        }
      }
    } catch (err) {
      console.warn('⚠️ Could not load saved blockchain, initializing fresh chain:', err.message);
    }

    const genesis = this.createGenesisBlock();
    const initialChain = [genesis];
    this.saveChain(initialChain);
    return initialChain;
  }

  saveChain(chainToSave = this.chain) {
    try {
      this.ensureStorageDir();
      fs.writeFileSync(this.storagePath, JSON.stringify(chainToSave, null, 2), 'utf8');
    } catch (err) {
      console.error('❌ Failed to save blockchain to disk:', err.message);
    }
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(data) {
    const previousBlock = this.getLatestBlock();
    const newBlock = new Block(
      previousBlock.index + 1,
      new Date().toISOString(),
      data,
      previousBlock.hash
    );
    this.chain.push(newBlock);
    this.saveChain();
    return newBlock;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (current.hash !== current.calculateHash()) return false;
      if (current.previousHash !== previous.hash) return false;
    }
    return true;
  }
}

module.exports = new Blockchain();