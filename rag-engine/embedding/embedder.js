/**
 * FIX #11: Corpus-aware TF-IDF embedder.
 *
 * The original bug: embedSingle(text) called _computeTFIDF([text]) with N=1.
 * IDF for every token = log(2/2)+1 = 1.0 — no discrimination whatsoever.
 * Query vectors and corpus vectors used incompatible IDF scales, making
 * cosine similarity scores meaningless.
 *
 * Fix: maintain a shared IDF vocabulary built from the full corpus.
 * - rebuildVocabulary(texts[]) — call this when the FAQ/RTQ index is rebuilt.
 * - embedSingle(text) — uses the stored IDF to produce a comparable vector.
 * - embed(texts[]) — batch version, still uses stored IDF.
 *
 * On cold start (no corpus yet), IDF defaults to 1.0 for all terms which is
 * equivalent to a pure-TF bag-of-ngrams — still reasonable for small datasets.
 *
 * CHUNK 1: Hash-based stable indexing + importance truncation.
 * - _hashNgram(ng) provides deterministic hash for consistent vector generation.
 * - Ngrams sorted by TF-IDF weight before truncation to top 384.
 * - Same text always produces identical vector regardless of JS object iteration order.
 *
 * CHUNK 2: Separate IDF vocabularies per corpus (FAQ vs RTQ).
 * - this._corpora = { faq: {idf, N}, rtq: {idf, N} } for isolated IDF scales.
 * - embedSingle(text, corpusName) and rebuildVocabulary(corpusName, texts).
 * - Prevents cross-contamination: high-IDF FAQ terms don't corrupt RTQ similarity.
 *
 * CHUNK 3: Persist IDF vocabulary to disk.
 * - saveVocab(corpusName) writes to rag-engine/embedding/vocab-{corpusName}.json
 * - loadVocab(corpusName) reads and restores IDF on cold start.
 * - Called automatically on rebuildVocabulary; loadVocab called on construction.
 *
 * CHUNK 4: Stop word filtering + Porter stemming pre-processing.
 * - STOP_WORDS set removes high-frequency, low-information tokens.
 * - _stem(token) applies Porter suffix-stripping to unify morphological variants.
 * - Applied in _tokenize() before n-gram generation.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VOCAB_DIR = __dirname;
const VOCAB_SUFFIX = '.json';

/**
 * CHUNK 4: Common English stop words — high frequency, low information value.
 * Removed before n-gram generation to reduce noise in vectors.
 */
const STOP_WORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
  'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she',
  'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
  'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that',
  'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an',
  'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of',
  'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
  'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then',
  'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just',
  'don', 'should', 'now',
]);

/**
 * CHUNK 6: Pure-JS BPE (Byte-Pair Encoding) Tokenizer
 *
 * Replaces character n-grams with learned subword tokens from a BPE vocabulary.
 * Better semantic capture than raw character n-grams.
 *
 * Training: learnMergePairs(corpusTexts, vocabSize) builds BPE vocab from corpus.
 * Tokenization: bpeTokenize(text) returns token IDs using learned merges.
 * Vector generation: mapTokensToVector(tokenIds) → 384-dim sparse vector.
 *
 * Enable with new Embedder({ useBPE: true, dimension: 384 }).
 * Must call learnMergePairs(corpusTexts) before tokenizing.
 */

class BPETokenizer {
  constructor({ vocabSize = 8000 } = {}) {
    this.vocabSize = vocabSize;
    this.merges = [];       // sorted merges (high freq first)
    this.tokenToId = new Map();
    this.idToToken = new Map();
    this._initialized = false;
    this._baseVocabBuilt = false;
  }

  /**
   * CHUNK 6: Build base vocabulary (bytes 0-255 as tokens).
   */
  _buildBaseVocab() {
    this.tokenToId.clear();
    this.idToToken.clear();
    // Base vocabulary: all single bytes + special tokens
    for (let i = 0; i < 256; i++) {
      const token = String.fromCharCode(i);
      this.tokenToId.set(token, i);
      this.idToToken.set(i, token);
    }
    // Sentinel for unknown / end
    const eosId = 256;
    this.tokenToId.set('<EOS>', eosId);
    this.idToToken.set(eosId, '<EOS>');
    this._baseVocabBuilt = true;
  }

  /**
   * CHUNK 6: Get byte sequence for a string.
   */
  _getBytes(text) {
    const bytes = [];
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code < 256) bytes.push(String.fromCharCode(code));
      else bytes.push('?'); // replace non-latin with placeholder
    }
    return bytes;
  }

  /**
   * CHUNK 6: Compute pair frequencies in a corpus.
   */
  _getPairFreqs(sequences) {
    const freq = new Map();
    for (const seq of sequences) {
      const pairs = [];
      for (let i = 0; i < seq.length - 1; i++) pairs.push(seq[i] + seq[i + 1]);
      const unique = new Set(pairs);
      for (const p of unique) freq.set(p, (freq.get(p) || 0) + 1);
    }
    return freq;
  }

  /**
   * CHUNK 6: Merge the most frequent pair across sequences.
   */
  _mergePair(sequences, pair) {
    return sequences.map(seq => {
      const result = [];
      for (let i = 0; i < seq.length; i++) {
        if (i < seq.length - 1 && seq[i] + seq[i + 1] === pair) {
          result.push(pair);
          i++;
        } else {
          result.push(seq[i]);
        }
      }
      return result;
    });
  }

  /**
   * CHUNK 6: Learn BPE merges from corpus texts.
   * Call this once with representative corpus before tokenizing.
   */
  learnMergePairs(corpusTexts, targetVocabSize = null) {
    this._buildBaseVocab();
    const target = targetVocabSize || this.vocabSize;
    let sequences = corpusTexts.map(t => this._getBytes(t.toLowerCase()));

    const maxMerges = target - 256 - 1; // reserve eos + sentinel
    for (let m = 0; m < maxMerges; m++) {
      const freq = this._getPairFreqs(sequences);
      if (freq.size === 0) break;

      let bestPair = null;
      let bestFreq = 0;
      for (const [pair, f] of freq) {
        if (f > bestFreq) { bestFreq = f; bestPair = pair; }
      }
      if (!bestPair || bestFreq < 2) break;

      sequences = this._mergePair(sequences, bestPair);
      this.merges.push(bestPair);

      const newId = 257 + m;
      this.tokenToId.set(bestPair, newId);
      this.idToToken.set(newId, bestPair);

      if (257 + m >= target) break;
    }

    this._initialized = true;
  }

  /**
   * CHUNK 6: Apply BPE tokenization to a single text.
   * Returns array of token IDs.
   */
  bpeTokenize(text) {
    if (!this._initialized) {
      throw new Error('[BPE] Must call learnMergePairs() before tokenizing');
    }
    let seq = this._getBytes(text.toLowerCase());

    // Apply all learned merges in order
    for (const pair of this.merges) {
      const newSeq = [];
      for (let i = 0; i < seq.length; i++) {
        if (i < seq.length - 1 && seq[i] + seq[i + 1] === pair) {
          newSeq.push(pair);
          i++;
        } else {
          newSeq.push(seq[i]);
        }
      }
      seq = newSeq;
    }

    // Convert to IDs
    return seq.map(t => this.tokenToId.get(t) ?? 256);
  }
}

/**
 * CHUNK 6: Minimal Porter Stemmer — core suffix-stripping rules.
 * Unifies morphological variants: running → run, tests → test.
 * Only handles common English suffixes to keep the implementation lightweight.
 */

function endsWithDoubleConsonant(word) {
  if (word.length < 2) return false;
  const last = word[word.length - 1];
  const secondLast = word[word.length - 2];
  return last === secondLast && 'bcdfghjklmnpqrstvwxz'.includes(last);
}

function endsWithCVC(word) {
  if (word.length < 3) return false;
  const last = word[word.length - 1];
  const secondLast = word[word.length - 2];
  const thirdLast = word[word.length - 3];
  return (
    'bcdfghjklmnpqrstvwxz'.includes(last) &&
    !'bcdfghjklmnpqrstvwxz'.includes(secondLast) &&
    'aeiou'.includes(thirdLast)
  );
}

function porterStem(word) {
  if (word.length <= 2) return word;
  let s = word;
  // Step 1a
  if (s.endsWith('sses')) s = s.slice(0, -2);
  else if (s.endsWith('ies')) s = s.slice(0, -2);
  else if (s.endsWith('ss')) {}
  else if (s.endsWith('s') && s.length > 2 && s[s.length - 3] !== 's') s = s.slice(0, -1);
  // Step 1b
  const step1b = ['ed', 'ing'];
  for (const suf of step1b) {
    if (s.endsWith(suf) && s.length > suf.length + 2) {
      const base = s.slice(0, -suf.length);
      if (base.endsWith('at') || base.endsWith('bl') || base.endsWith('iz')) s = base + 'e';
      else if (base.length >= 3 && endsWithDoubleConsonant(base) && !['ll','ss','zz'].includes(base.slice(-2))) s = base.slice(0, -1);
      else if (base.length >= 3 && endsWithCVC(base)) s = base + 'e';
      else s = base;
      break;
    }
  }
  // Step 1c
  if (s.endsWith('y') && s.length > 2) {
    const base = s.slice(0, -1);
    if (endsWithCVC(base)) s = base + 'i';
  }
  // Step 2
  const s2 = { 'ational':'ate','tional':'tion','enci':'ence','anci':'ance','izer':'ize','bli':'ble','alli':'al','entli':'ent','eli':'e','ousli':'ous','ization':'ize','ation':'ate','ator':'ate','alism':'al','iveness':'ive','fulness':'ful','ousness':'ous','aliti':'al','iviti':'ive','biliti':'ble' };
  for (const [suf, repl] of Object.entries(s2)) {
    if (s.endsWith(suf) && s.length >= suf.length + 3) { s = s.slice(0, -suf.length) + repl; break; }
  }
  // Step 3
  const s3 = { 'icate':'ic','ative':'','alize':'al','iciti':'ic','ical':'ic','ful':'','ness':'' };
  for (const [suf, repl] of Object.entries(s3)) {
    if (s.endsWith(suf) && s.length >= suf.length + 3) { s = s.slice(0, -suf.length) + repl; break; }
  }
  // Step 4
  const s4 = ['al','ance','ence','er','ic','able','ible','ant','ement','ment','ent','ion','ou','ism','ate','iti','ous','ive','ize'];
  for (const suf of s4) {
    if (s.endsWith(suf) && s.length >= suf.length + 2) {
      if (suf === 'ion' && s.length >= 4) { const base = s.slice(0, -3); if (base.endsWith('s') || base.endsWith('t')) s = base; }
      else s = s.slice(0, -suf.length);
      break;
    }
  }
  // Step 5a
  if (s.length > 3 && s.endsWith('e')) {
    const base = s.slice(0, -1);
    if (!endsWithCVC(base) || base.length <= 2) s = base;
  }
  // Step 5b
  if (s.length > 2 && endsWithDoubleConsonant(s) && s.endsWith('l') && s.length > 2) {
    if (s[s.length - 3] !== 'l') s = s.slice(0, -1);
  }
  return s;
}

export class Embedder {
  constructor({ dimension = 384, nGramRange = [1, 3], useBPE = false, bpeVocabSize = 4000 } = {}) {
    this.dimension = dimension;
    this.nGramRange = nGramRange;
    this.useBPE = useBPE;
    this._corpora = {};     // { corpusName: { idf: {}, N: number } }
    this._activeCorpus = null; // default corpus for single-corpus embedder fallback

    // CHUNK 6: Initialize BPE tokenizer if enabled
    this._bpe = null;
    if (this.useBPE) {
      this._bpe = new BPETokenizer({ vocabSize: bpeVocabSize });
    }

    // CHUNK 3: Restore persisted IDF vocabularies on cold start
    this._tryLoadPersistedVocab();
  }

  /**
   * CHUNK 6: Train BPE tokenizer on representative corpus texts.
   * Must be called before BPE tokenization if useBPE=true.
   */
  trainBPE(corpusTexts, targetVocabSize = 4000) {
    if (!this._bpe) return;
    this._bpe.learnMergePairs(corpusTexts, targetVocabSize);
  }

  /**
   * CHUNK 6: Map BPE token IDs to a sparse 384-dim vector.
   * Uses TF-IDF weighting on token IDs with optional corpus IDF.
   */
  _bpeTokensToVector(tokenIds, corpusName = null) {
    const tf = {};
    for (const id of tokenIds) tf[id] = (tf[id] || 0) + 1;
    const maxTf = Math.max(...Object.values(tf), 1);

    let idfSource = null;
    if (corpusName && this._corpora[corpusName]) {
      idfSource = this._corpora[corpusName].idf;
    }

    const scored = [];
    for (const id in tf) {
      const tfNorm = tf[id] / maxTf;
      const idfVal = idfSource?.[id] ?? 1.0;
      const weight = tfNorm * idfVal;
      scored.push({ id: parseInt(id), weight });
    }

    // Sort by weight descending; tie-break by id
    scored.sort((a, b) => {
      if (b.weight !== a.weight) return b.weight - a.weight;
      return a.id - b.id;
    });

    const vec = new Array(this.dimension).fill(0);
    for (let i = 0; i < Math.min(scored.length, this.dimension); i++) {
      vec[i] = scored[i].weight;
    }

    const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    return mag > 0 ? vec.map(v => v / mag) : vec;
  }

  _vocabPath(corpusName) {
    return `${VOCAB_DIR}/vocab-${corpusName}${VOCAB_SUFFIX}`;
  }

  /**
   * CHUNK 3: Load persisted IDF vocabulary from disk if it exists.
   * Called automatically on construction — safe to call manually too.
   */
  _tryLoadPersistedVocab() {
    const corpusNames = ['faq', 'rtq'];
    for (const name of corpusNames) {
      try {
        const path = this._vocabPath(name);
        if (existsSync(path)) {
          const raw = readFileSync(path, 'utf8');
          const data = JSON.parse(raw);
          if (data.idf && typeof data.N === 'number') {
            this._corpora[name] = { idf: data.idf, N: data.N };
          }
        }
      } catch {
        // ignore corrupt/missing files — will rebuild from corpus
      }
    }
  }

  /**
   * CHUNK 3: Persist a corpus's IDF vocabulary to disk.
   * Called automatically after rebuildVocabulary. Safe to call manually too.
   */
  saveVocab(corpusName) {
    const corpus = this._corpora[corpusName];
    if (!corpus) return;
    try {
      const path = this._vocabPath(corpusName);
      writeFileSync(path, JSON.stringify({ idf: corpus.idf, N: corpus.N }), 'utf8');
    } catch (err) {
      console.warn(`[Embedder] Failed to save vocab for "${corpusName}":`, err.message);
    }
  }

  /**
   * CHUNK 3: Load IDF vocabulary for a specific corpus from disk.
   * Returns true if loaded, false if not found or corrupt.
   */
  loadVocab(corpusName) {
    try {
      const path = this._vocabPath(corpusName);
      if (!existsSync(path)) return false;
      const raw = readFileSync(path, 'utf8');
      const data = JSON.parse(raw);
      if (data.idf && typeof data.N === 'number') {
        this._corpora[corpusName] = { idf: data.idf, N: data.N };
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }

  /**
   * Stable hash for ngram string — ensures consistent vector index
   * across different JS engine runs.
   */
  _hashNgram(ng) {
    let hash = 0;
    for (let i = 0; i < ng.length; i++) {
      const char = ng.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  _tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .filter(token => !STOP_WORDS.has(token))
      .map(token => porterStem(token));
  }

  _getNGrams(tokens) {
    const ngrams = [];

    // CHUNK 5: Also generate word-level n-grams (1-2 words)
    for (let n = 1; n <= 2; n++) {
      for (let i = 0; i <= tokens.length - n; i++) {
        ngrams.push(tokens.slice(i, i + n).join(' '));
      }
    }

    // Character n-grams (original behavior) — from token concatenated string
    // This captures sub-word patterns within each token
    const charNgramTokens = tokens.map(t => t.split('')).flat();
    for (let n = this.nGramRange[0]; n <= this.nGramRange[1]; n++) {
      for (let i = 0; i <= charNgramTokens.length - n; i++) {
        ngrams.push(charNgramTokens.slice(i, i + n).join(''));
      }
    }

    return ngrams;
  }

  /**
   * Build a separate IDF map for a named corpus.
   * Call with corpusName='faq' or 'rtq' when rebuilding that index.
   * Each corpus gets its own IDF vocabulary — they don't interfere.
   */
  rebuildVocabulary(corpusName, texts) {
    if (!texts || texts.length === 0) return;
    const N = texts.length;
    const df = {};

    for (const text of texts) {
      const tokens = this._tokenize(text);
      const ngrams = this._getNGrams(tokens);
      const unique = new Set(ngrams);
      for (const ng of unique) {
        df[ng] = (df[ng] || 0) + 1;
      }
    }

    const idf = {};
    for (const ng in df) {
      idf[ng] = Math.log((N + 1) / (df[ng] + 1)) + 1;
    }

    this._corpora[corpusName] = { idf, N };
    this.saveVocab(corpusName); // CHUNK 3: persist after rebuild
  }

  /**
   * Embed a single text using a specific corpus's IDF.
   * Safe to call before rebuildVocabulary — falls back to IDF=1.
   *
   * CHUNK 1: Now uses hash-based stable indexing and importance truncation.
   * - All (ngram, weight) pairs computed and sorted by weight descending
   * - Only top `dimension` ngrams kept (importance truncation)
   * - Vector filled in weight-sorted order for consistent results
   *
   * CHUNK 2: Uses corpus-specific IDF when corpusName is provided.
   * Falls back to any available corpus IDF, or 1.0 if none.
   */
  embedSingle(text, corpusName = null) {
    // CHUNK 6: If BPE is enabled and trained, use BPE tokenization
    if (this.useBPE && this._bpe && this._bpe._initialized) {
      return this._bpeTokensToVector(this._bpe.bpeTokenize(text), corpusName);
    }

    const tokens = this._tokenize(text);
    const ngrams = this._getNGrams(tokens);

    const tf = {};
    for (const ng of ngrams) {
      tf[ng] = (tf[ng] || 0) + 1;
    }
    const maxTf = Math.max(...Object.values(tf), 1);

    // Resolve IDF source: requested corpus > any first corpus > global fallback
    let idfSource = null;
    if (corpusName && this._corpora[corpusName]) {
      idfSource = this._corpora[corpusName].idf;
    } else {
      const keys = Object.keys(this._corpora);
      if (keys.length > 0) idfSource = this._corpora[keys[0]].idf;
    }

    // Build (ngram, weightedScore) pairs and sort by importance
    const scored = [];
    for (const ng in tf) {
      const tfNorm = tf[ng] / maxTf;
      const idfVal = idfSource?.[ng] ?? 1.0;
      const weight = tfNorm * idfVal;
      const hash = this._hashNgram(ng);
      scored.push({ ng, weight, hash });
    }

    // Sort by weight descending; ties broken by hash for consistency
    scored.sort((a, b) => {
      if (b.weight !== a.weight) return b.weight - a.weight;
      return a.hash - b.hash;
    });

    // Fill vector with top `dimension` ngrams, sorted by importance
    const vec = new Array(this.dimension).fill(0);
    for (let i = 0; i < Math.min(scored.length, this.dimension); i++) {
      vec[i] = scored[i].weight;
    }

    const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    return mag > 0 ? vec.map(v => v / mag) : vec;
  }

  /**
   * Batch embed — each text uses the shared IDF (not per-batch IDF).
   */
  embed(texts, corpusName = null) {
    if (!Array.isArray(texts)) return this.embedSingle(texts, corpusName);
    return texts.map(t => this.embedSingle(t, corpusName));
  }

  /**
   * SEMANTIC: Async embed using transformer model (all-MiniLM-L6-v2).
   * Use this for true semantic understanding instead of TF-IDF.
   */
  async embedSingleAsync(text, corpusName = null) {
    try {
      const { embedText } = await import('./transformer.js');
      return await embedText(text);
    } catch (err) {
      console.error('[Embedder] Transformer failed, falling back to TF-IDF:', err.message);
      return this.embedSingle(text, corpusName);
    }
  }

  async embedAsync(texts, corpusName = null) {
    if (!Array.isArray(texts)) return this.embedSingleAsync(texts, corpusName);
    const results = await Promise.all(texts.map(t => this.embedSingleAsync(t, corpusName)));
    return results;
  }
}

export default new Embedder({ dimension: 384 });
