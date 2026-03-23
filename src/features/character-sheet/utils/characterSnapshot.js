import { deepClone } from '@/shared/utils/utils.js';

function normalizeSnapshotPayload(source = {}) {
  return {
    character: deepClone(source.character || {}),
    skills: deepClone(Array.isArray(source.skills) ? source.skills : []),
    specialSkills: deepClone(Array.isArray(source.specialSkills) ? source.specialSkills : []),
    equipments: deepClone(source.equipments || {}),
    histories: deepClone(Array.isArray(source.histories) ? source.histories : []),
  };
}

export function buildCharacterStateSnapshot(source) {
  const normalized = normalizeSnapshotPayload(source);
  return JSON.stringify(normalized);
}

export function buildSnapshotFromStore(characterStore) {
  if (!characterStore) {
    return null;
  }
  return buildCharacterStateSnapshot({
    character: characterStore.character,
    skills: characterStore.skills,
    specialSkills: characterStore.specialSkills,
    equipments: characterStore.equipments,
    histories: characterStore.histories,
  });
}
