import { evaluateQuestion } from '../../../rag-engine/decision-engine/decision.tree.js';

export async function evaluate(req, res) {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ message: 'question is required' });

    const result = await evaluateQuestion(question);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function rebuildVectors(req, res) {
  try {
    // Use Qdrant-based rebuild via sync repair service (Sentence Transformer embeddings)
    const { rebuildFAQRVectors, rebuildRTQVectors } = await import('../services/sync/sync.repair.service.js');

    const faqResult = await rebuildFAQRVectors();
    const rtqResult = await rebuildRTQVectors();

    res.json({
      message: 'Vectors rebuilt via Qdrant (Sentence Transformer)',
      faqs: faqResult.rebuilt,
      rtqs: rtqResult.rebuilt,
      faqFailed: faqResult.failed,
      rtqFailed: rtqResult.failed,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}