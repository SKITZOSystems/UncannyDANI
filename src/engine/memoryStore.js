const STORAGE_KEY = 'uncanny-dani:session-state:v1';
const SESSION_ID_KEY = 'uncanny-dani:session-id:v1';
const memory = new Map();
let sessionId = null;
let hydrated = false;

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage;
}

function generateSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `dani-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function hydrate() {
  if (hydrated) {
    return;
  }

  hydrated = true;
  const storage = getStorage();

  if (storage === null) {
    sessionId = sessionId ?? generateSessionId();
    return;
  }

  sessionId = storage.getItem(SESSION_ID_KEY) ?? generateSessionId();
  storage.setItem(SESSION_ID_KEY, sessionId);

  const rawState = storage.getItem(STORAGE_KEY);
  if (rawState === null) {
    return;
  }

  try {
    const parsedState = JSON.parse(rawState);
    if (Array.isArray(parsedState?.entries)) {
      memory.clear();
      for (const [key, value] of parsedState.entries) {
        memory.set(key, value);
      }
    }
  } catch {
    memory.clear();
  }
}

function persist() {
  const storage = getStorage();
  if (storage === null) {
    return;
  }

  try {
    storage.setItem(SESSION_ID_KEY, sessionId ?? generateSessionId());
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        sessionId: sessionId ?? generateSessionId(),
        entries: Array.from(memory.entries())
      })
    );
  } catch {
    // sessionStorage can be unavailable in restricted contexts; keep memory local.
  }
}

function clearStorage() {
  const storage = getStorage();
  if (storage === null) {
    return;
  }

  storage.removeItem(SESSION_ID_KEY);
  storage.removeItem(STORAGE_KEY);
}

export function getSessionId() {
  hydrate();
  if (sessionId === null) {
    sessionId = generateSessionId();
  }

  return sessionId;
}

export function resetSession() {
  hydrate();
  memory.clear();
  clearStorage();
  sessionId = generateSessionId();
  hydrated = true;
  persist();
  return sessionId;
}

export function readMemory(key) {
  hydrate();
  return memory.get(key);
}

export function writeMemory(key, value) {
  hydrate();
  memory.set(key, value);
  persist();
}

export function appendMemoryList(key, value) {
  hydrate();
  const currentValue = memory.get(key);
  const nextValue = Array.isArray(currentValue) ? [...currentValue, value] : [value];
  memory.set(key, nextValue);
  persist();
  return nextValue;
}

export function readMemoryList(key) {
  hydrate();
  const currentValue = memory.get(key);
  return Array.isArray(currentValue) ? currentValue : [];
}

export function readNarrativeState() {
  hydrate();
  return memory.get('dani:narrative') ?? null;
}

export function writeNarrativeState(nextState) {
  hydrate();
  const currentState = memory.get('dani:narrative') ?? {};
  const updatedState = {
    ...currentState,
    ...nextState,
    sessionId: getSessionId()
  };

  memory.set('dani:narrative', updatedState);
  persist();
  return updatedState;
}
