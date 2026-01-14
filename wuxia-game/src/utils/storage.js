
const STORAGE_KEY = 'wuxia_game_data';
const CURRENT_VERSION = 2;

/**
 * Storage Schema v2:
 * {
 *   meta: { version: 2 },
 *   slots: [
 *     null | { player: {...}, logs: [...], battleReports: [...], lastPlayed: timestamp },
 *     null | { ... },
 *     null | { ... }
 *   ]
 * }
 */

export function loadGlobalData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createDefaultStorage();
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error("Save data corrupted, resetting.", e);
    return createDefaultStorage();
  }

  return migrateData(data);
}

export function saveGlobalData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function createDefaultStorage() {
  return {
    meta: { version: CURRENT_VERSION },
    slots: [null, null, null] // 3 Slots
  };
}

function migrateData(data) {
  // 1. Check version
  let version = 1;
  if (data.meta && data.meta.version) {
    version = data.meta.version;
  } else {
    // Attempt to detect v1 (Old Single Object)
    // v1 looks like: { player: {...}, logs: [...] }
    if (data.player && data.logs) {
      version = 1;
    } else {
      // Unknown empty or weird structure
      if (Object.keys(data).length === 0) version = 0; // Empty
    }
  }

  if (version === CURRENT_VERSION) return data;

  console.log(`Migrating save data from v${version} to v${CURRENT_VERSION}...`);

  // Migration Pipeline
  let migrated = data;

  if (version === 1) {
    migrated = migrateV1toV2(migrated);
    version = 2;
  }

  // Save the migrated data immediately
  saveGlobalData(migrated);
  return migrated;
}

function migrateV1toV2(oldData) {
  // Move the single save object into Slot 0
  const newStorage = createDefaultStorage();

  // Inject lastPlayed if missing
  if (!oldData.lastPlayed) {
    oldData.lastPlayed = Date.now();
  }

  newStorage.slots[0] = oldData;
  return newStorage;
}
