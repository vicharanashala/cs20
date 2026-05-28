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
 */

export class Embedder {
  constructor({ dimension = 384, nGramRange = [1, 3] } = {}) {
    this.dimension = dimension;
    this.nGramRange = nGramRange;
    this._idf = {};         // shared IDF vocabulary
    this._corpusSize = 0;   // N used to build current IDF
  }

  _tokenize(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  }

  _getNGrams(tokens) {
    const ngrams = [];
    for (let n = this.nGramRange[0]; n <= this.nGramRange[1]; n++) {
      for (let i = 0; i <= tokens.length - n; i++) {
        ngrams.push(tokens.slice(i, i + n).join(' '));
      }
    }
    return ngrams;
  }

  /**
   * Build a shared IDF map from an array of corpus documents.
   * Call this whenever FAQ or RTQ index is rebuilt.
   */
  rebuildVocabulary(texts) {
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

    this._idf = idf;
    this._corpusSize = N;
  }

  /**
   * Embed a single text using the stored corpus IDF.
   * Safe to call before rebuildVocabulary — falls back to IDF=1.
   */
  embedSingle(text) {
    const tokens = this._tokenize(text);
    const ngrams = this._getNGrams(tokens);

    const tf = {};
    for (const ng of ngrams) {
      tf[ng] = (tf[ng] || 0) + 1;
    }
    const maxTf = Math.max(...Object.values(tf), 1);

    const vec = new Array(this.dimension).fill(0);
    let idx = 0;
    for (const ng in tf) {
      const tfNorm = tf[ng] / maxTf;
      // Use stored IDF if available; fall back to 1.0 for unseen terms
      const idfVal = this._idf[ng] !== undefined ? this._idf[ng] : 1.0;
      const weight = tfNorm * idfVal;
      if (idx < this.dimension) {
        vec[idx++] = weight;
      }
    }

    const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    return mag > 0 ? vec.map(v => v / mag) : vec;
  }

  /**
   * Batch embed — each text uses the shared IDF (not per-batch IDF).
   */
  embed(texts) {
    if (!Array.isArray(texts)) return this.embedSingle(texts);
    return texts.map(t => this.embedSingle(t));
  }
}

export default new Embedder({ dimension: 384 });
