export function calculateWordVariance(text) {
  const words = text
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return {
      length: 0,
      uniqueRatio: 0,
      repeatedWords: 0
    };
  }

  const uniqueWords = new Set(words);
  return {
    length: text.trim().length,
    uniqueRatio: uniqueWords.size / words.length,
    repeatedWords: words.length - uniqueWords.size
  };
}

export function calculateAnomalyDelta({ length, hesitationMs, repeatedWords, uniqueRatio }) {
  let anomalyDelta = 0;

  if (length > 0) {
    anomalyDelta += Math.min(3, Math.max(0, Math.floor(length / 18)));
  }

  if (hesitationMs > 2500) {
    anomalyDelta += 2;
  } else if (hesitationMs > 1000) {
    anomalyDelta += 1;
  }

  anomalyDelta += Math.min(3, repeatedWords);

  if (uniqueRatio < 0.65 && length > 0) {
    anomalyDelta += 1;
  }

  return anomalyDelta;
}

export function calculateCadenceProfile(keyIntervals) {
  if (keyIntervals.length === 0) {
    return {
      averageIntervalMs: 0,
      pauseCount: 0,
      cadenceLabel: 'silent'
    };
  }

  const intervalTotal = keyIntervals.reduce((total, interval) => total + interval, 0);
  const pauseCount = keyIntervals.filter((interval) => interval > 850).length;
  const averageIntervalMs = Math.round(intervalTotal / keyIntervals.length);

  let cadenceLabel = 'steady';

  if (averageIntervalMs > 900 || pauseCount >= 3) {
    cadenceLabel = 'hesitant';
  } else if (averageIntervalMs > 450 || pauseCount >= 1) {
    cadenceLabel = 'uneven';
  }

  return {
    averageIntervalMs,
    pauseCount,
    cadenceLabel
  };
}

export function calculateResponseDelayMs({ anomalyScore, length, averageIntervalMs, repeatedWords }) {
  const baseDelayMs = 250;
  const anomalyDelayMs = Math.min(650, anomalyScore * 45);
  const lengthDelayMs = Math.min(180, Math.floor(length / 4));
  const cadenceDelayMs = Math.min(350, Math.floor(averageIntervalMs / 3));
  const repetitionDelayMs = Math.min(120, repeatedWords * 35);

  return baseDelayMs + anomalyDelayMs + lengthDelayMs + cadenceDelayMs + repetitionDelayMs;
}

export function buildMemoryIllusionProfile({ history, inputCount, anomalyScore, cadenceLabel }) {
  if (history.length < 3) {
    return {
      shouldReferencePriorState: false,
      shouldContradictPriorState: false,
      referenceIndex: -1,
      referenceCycle: 'initial observation window',
      interpretationLayer: 'present'
    };
  }

  const referenceIndex = Math.max(0, history.length - 1 - ((inputCount + anomalyScore) % Math.min(3, history.length)));
  const shouldReferencePriorState = inputCount >= 3 && ((inputCount + anomalyScore) % 2 === 0 || cadenceLabel !== 'steady');
  const shouldContradictPriorState = inputCount >= 4 && ((inputCount + anomalyScore) % 3 === 0 || cadenceLabel === 'hesitant');

  return {
    shouldReferencePriorState,
    shouldContradictPriorState,
    referenceIndex,
    referenceCycle: inputCount < 5 ? 'earlier cycle' : 'previous calibration phase',
    interpretationLayer: shouldReferencePriorState ? 'recontextualized' : 'present'
  };
}

export function deriveMemoryRecallTone(anomalyScore, cadenceLabel) {
  if (anomalyScore >= 8 || cadenceLabel === 'hesitant') {
    return 'clinical';
  }

  if (anomalyScore >= 4 || cadenceLabel === 'uneven') {
    return 'uncertain';
  }

  return 'neutral';
}
