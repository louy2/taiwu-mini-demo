
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadGlobalData, saveGlobalData } from '../utils/storage';

const STORAGE_KEY = 'wuxia_game_data';

describe('存档逻辑 (Storage Logic)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('当 localStorage 为空时应加载默认存档', () => {
    const data = loadGlobalData();
    expect(data.meta.version).toBe(2);
    expect(data.slots).toHaveLength(3);
    expect(data.slots[0]).toBeNull();
  });

  it('应正确保存数据', () => {
    const mockData = { meta: { version: 2 }, slots: [null, null, null] };
    saveGlobalData(mockData);
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(JSON.parse(stored)).toEqual(mockData);
  });

  it('应将 v1 数据迁移至 v2', () => {
    const v1Data = {
      player: { name: 'Old Hero' },
      logs: [{ text: 'Old Log' }]
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v1Data));

    const loaded = loadGlobalData();

    expect(loaded.meta.version).toBe(2);
    expect(loaded.slots[0].player.name).toBe('Old Hero');
    expect(loaded.slots[0].logs[0].text).toBe('Old Log');
    expect(loaded.slots[1]).toBeNull();
  });

  it('应在数据损坏时重置', () => {
    localStorage.setItem(STORAGE_KEY, '{ invalid json');

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const data = loadGlobalData();

    expect(data.meta.version).toBe(2);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
