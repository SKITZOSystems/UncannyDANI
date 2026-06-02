export function buildResponse({
  text,
  anomalyScore,
  repeatedWords,
  uniqueRatio,
  cadenceLabel,
  inputCount,
  memoryIllusion = null
}) {
  const normalizedText = text.trim();
  const receivedText = normalizedText.length > 0 ? normalizedText : '[silence]';
  const cadenceLine = buildCadenceLine(cadenceLabel);
  const contradictionLine = buildContradictionLine({ anomalyScore, inputCount });
  const memoryLines = buildMemoryLines(memoryIllusion);

  if (anomalyScore >= 10 || repeatedWords >= 2 || uniqueRatio < 0.55) {
    return compactLines([
      `RECEIVED: '${receivedText}'`,
      'CLASSIFICATION: unstable confirmation signal',
      cadenceLine,
      contradictionLine,
      ...memoryLines,
      'MEMORY STATUS: partial overlap'
    ]);
  }

  if (anomalyScore >= 6 || repeatedWords >= 1 || uniqueRatio < 0.75) {
    return compactLines([
      `RECEIVED: '${receivedText}'`,
      `YOU USED THE WORD '${getPrimaryWord(normalizedText)}' PREVIOUSLY`,
      cadenceLine,
      contradictionLine,
      ...memoryLines,
      'CLASSIFICATION: drift echo'
    ]);
  }

  return compactLines([
    `RECEIVED: '${receivedText}'`,
    cadenceLine,
    contradictionLine,
    ...memoryLines,
    'CLASSIFICATION: stable input sample',
    'REFERENCE: vector accepted'
  ]);
}

function getPrimaryWord(text) {
  const words = text
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return words[0] ?? 'silence';
}

function buildCadenceLine(cadenceLabel) {
  if (cadenceLabel === 'hesitant') {
    return 'INPUT CADENCE: hesitation detected';
  }

  if (cadenceLabel === 'uneven') {
    return 'INPUT CADENCE: minor drift observed';
  }

  if (cadenceLabel === 'silent') {
    return 'INPUT CADENCE: no key variance recorded';
  }

  return 'INPUT CADENCE: stable';
}

function buildContradictionLine({ anomalyScore, inputCount }) {
  if (inputCount > 0 && (anomalyScore + inputCount) % 4 === 0) {
    return 'CONTRADICTION: no anomaly detected';
  }

  if (anomalyScore >= 8 && inputCount % 3 === 0) {
    return 'CONTRADICTION: anomaly previously confirmed';
  }

  return null;
}

function buildMemoryLines(memoryIllusion) {
  if (memoryIllusion === null || memoryIllusion.shouldReferencePriorState === false) {
    return [];
  }

  const tone = memoryIllusion.tone ?? 'neutral';

  if (memoryIllusion.shouldContradictPriorState) {
    return compactLines([
      `PRIOR STATE: ${memoryIllusion.referenceCycle} reclassified`,
      `MEMORY TONE: ${tone}`,
      'MEMORY ASSERTION: instability previously recorded'
    ]);
  }

  return compactLines([
    `PRIOR STATE: ${memoryIllusion.referenceCycle} confirmed`,
    `MEMORY TONE: ${tone}`,
    'MEMORY ASSERTION: response matches earlier observation'
  ]);
}

function compactLines(lines) {
  return lines.filter(Boolean);
}
