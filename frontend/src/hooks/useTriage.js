import { useState, useRef, useCallback } from 'react';

// Keyword-based severity rules (offline fallback when model not loaded)
const SEVERITY_KEYWORDS = {
  CRITICAL: ['unconscious','not breathing','no pulse','bleeding heavily','critical','severe','dying','collapsed','head injury','chest pain','multiple victims','trapped'],
  MODERATE: ['injured','hurt','bleeding','broken','fracture','pain','dizzy','breathless','moderate','semi-conscious'],
  MINOR:    ['minor','scratch','bruise','slight','small','ok','stable','conscious','awake'],
};

const INTENT_KEYWORDS = {
  accident:   ['accident','crash','collision','hit','struck','fell','rolled'],
  breakdown:  ['breakdown','stalled','engine','flat tyre','puncture','towing','stranded'],
  medical:    ['medical','seizure','heart','stroke','breathing','unconscious','diabetic'],
  harassment: ['harassment','fight','violence','attack','rob'],
};

function keywordClassify(text) {
  const lower = text.toLowerCase();

  let severity = 'MODERATE';
  for (const [sev, keywords] of Object.entries(SEVERITY_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) { severity = sev; break; }
  }

  let intent = 'accident';
  for (const [int, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) { intent = int; break; }
  }

  return { severity, intent, confidence: 0.75, method: 'keyword' };
}

/**
 * useTriage — AI injury severity and intent classification.
 * Uses @xenova/transformers DistilBERT on-device (offline capable).
 * Falls back to keyword rules if model isn't loaded yet.
 */
export function useTriage() {
  const [severity, setSeverity] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const pipelineRef = useRef(null);
  const loadingRef = useRef(false);

  // Lazy-load model
  const loadModel = useCallback(async () => {
    if (pipelineRef.current || loadingRef.current) return;
    loadingRef.current = true;
    try {
      const { pipeline } = await import('@xenova/transformers');
      // Use zero-shot classification to classify severity without fine-tuning
      pipelineRef.current = await pipeline(
        'zero-shot-classification',
        'Xenova/distilbart-mnli-12-3',
        { revision: 'main' }
      );
    } catch (err) {
      console.warn('Model load failed, using keyword fallback:', err.message);
    } finally {
      loadingRef.current = false;
    }
  }, []);

  const classify = useCallback(async (text) => {
    if (!text?.trim()) return null;
    setIsLoading(true);

    // Try to load model in background
    loadModel().catch(() => {});

    try {
      let result;
      if (pipelineRef.current) {
        // On-device model inference
        const labels = ['critical emergency requiring immediate trauma care',
                        'moderate injury requiring medical attention',
                        'minor incident not immediately life-threatening'];
        const output = await pipelineRef.current(text, labels);
        const topLabel = output.labels[0];
        const severity = topLabel.includes('critical') ? 'CRITICAL'
                       : topLabel.includes('moderate') ? 'MODERATE' : 'MINOR';
        result = { severity, intent: 'accident', confidence: output.scores[0], method: 'model' };
      } else {
        // Keyword fallback (always works offline)
        result = keywordClassify(text);
      }

      setSeverity(result.severity);
      return result;
    } catch (err) {
      const fallback = keywordClassify(text);
      setSeverity(fallback.severity);
      return fallback;
    } finally {
      setIsLoading(false);
    }
  }, [loadModel]);

  return { classify, severity, isLoading };
}
