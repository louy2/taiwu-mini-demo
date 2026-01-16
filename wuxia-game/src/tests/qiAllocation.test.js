import { describe, it, expect, beforeEach } from 'vitest';
import { state, allocateAllQi, allocateEvenly, resetQiAllocation, resetState } from '../gameLogic';

describe('真气分配逻辑 (Qi Allocation)', () => {
  beforeEach(() => {
    resetState();
    state.player.qi = 100;
    state.player.qiDestruction = 0;
    state.player.qiProtection = 0;
  });

  it('应该能一次性分配所有真气给摧破', () => {
    allocateAllQi('destruction');
    expect(state.player.qiDestruction).toBe(100);
    expect(state.player.qiProtection).toBe(0);
  });

  it('应该能一次性分配所有真气给护体', () => {
    allocateAllQi('protection');
    expect(state.player.qiDestruction).toBe(0);
    expect(state.player.qiProtection).toBe(100);
  });

  it('应该能平均分配真气 (偶数)', () => {
    allocateEvenly();
    expect(state.player.qiDestruction).toBe(50);
    expect(state.player.qiProtection).toBe(50);
  });

  it('应该能平均分配真气 (奇数)', () => {
    state.player.qi = 101;
    allocateEvenly();
    expect(state.player.qiDestruction).toBe(51);
    expect(state.player.qiProtection).toBe(50);
  });

  it('应该能重置真气分配', () => {
    allocateAllQi('destruction');
    expect(state.player.qiDestruction).toBe(100);
    resetQiAllocation();
    expect(state.player.qiDestruction).toBe(0);
    expect(state.player.qiProtection).toBe(0);
  });

  it('应该在已有分配时正确补齐 (分配所有)', () => {
    state.player.qiDestruction = 10;
    // Remaining 90
    allocateAllQi('protection');
    expect(state.player.qiDestruction).toBe(10);
    expect(state.player.qiProtection).toBe(90);
  });
});
