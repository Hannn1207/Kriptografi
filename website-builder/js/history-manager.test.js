/**
 * Tests for history-manager.js
 * Unit tests and property-based tests for Properties 8 and 9
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { addEntry, getEntries, clearAll, renderHistory } from './history-manager.js';

// Helper: sample operation entry (without id/timestamp)
function makeOperation(overrides = {}) {
  return {
    type: 'Enkripsi',
    key: { n: 3233, e: 17 },
    input: 'Hello',
    output: '2790 2345 1234 1234 2019',
    ...overrides,
  };
}

// Arbitrary for valid operation entries
const operationArbitrary = fc.record({
  type: fc.constantFrom('Enkripsi', 'Dekripsi'),
  key: fc.record({
    n: fc.integer({ min: 1, max: 99999 }),
    e: fc.option(fc.integer({ min: 1, max: 9999 }), { nil: undefined }),
    d: fc.option(fc.integer({ min: 1, max: 9999 }), { nil: undefined }),
  }),
  input: fc.string({ minLength: 1, maxLength: 50 }),
  output: fc.string({ minLength: 1, maxLength: 100 }),
});

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe('history-manager — unit tests', () => {
  beforeEach(() => {
    clearAll();
  });

  it('getEntries() returns [] when history is empty', () => {
    expect(getEntries()).toEqual([]);
  });

  it('getEntries() returns [] after clearAll()', () => {
    addEntry(makeOperation());
    addEntry(makeOperation({ type: 'Dekripsi' }));
    clearAll();
    expect(getEntries()).toEqual([]);
  });

  it('addEntry returns a complete entry with id and timestamp', () => {
    const op = makeOperation();
    const result = addEntry(op);

    expect(result).toHaveProperty('id');
    expect(typeof result.id).toBe('string');
    expect(result.id.length).toBeGreaterThan(0);

    expect(result).toHaveProperty('timestamp');
    expect(result.timestamp).toBeInstanceOf(Date);

    expect(result.type).toBe(op.type);
    expect(result.key).toEqual(op.key);
    expect(result.input).toBe(op.input);
    expect(result.output).toBe(op.output);
  });

  it('getEntries() returns all added entries', () => {
    addEntry(makeOperation({ input: 'A' }));
    addEntry(makeOperation({ input: 'B' }));
    addEntry(makeOperation({ input: 'C' }));

    const entries = getEntries();
    expect(entries).toHaveLength(3);
  });

  it('getEntries() returns a copy (mutation does not affect internal state)', () => {
    addEntry(makeOperation());
    const entries = getEntries();
    entries.push({ fake: true });
    expect(getEntries()).toHaveLength(1);
  });

  it('each entry has a unique id', () => {
    addEntry(makeOperation());
    addEntry(makeOperation());
    addEntry(makeOperation());

    const entries = getEntries();
    const ids = entries.map(e => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('renderHistory shows empty message when no entries', () => {
    const el = { innerHTML: '' };
    renderHistory(el);
    expect(el.innerHTML).toContain('Belum ada riwayat operasi');
  });

  it('renderHistory renders entries when history is not empty', () => {
    addEntry(makeOperation({ type: 'Enkripsi', input: 'Hello', output: '2790' }));
    const el = { innerHTML: '' };
    renderHistory(el);
    expect(el.innerHTML).toContain('Enkripsi');
    expect(el.innerHTML).toContain('Hello');
    expect(el.innerHTML).toContain('2790');
  });

  it('renderHistory is a no-op when targetElement is null/undefined', () => {
    // Should not throw
    expect(() => renderHistory(null)).not.toThrow();
    expect(() => renderHistory(undefined)).not.toThrow();
  });
});

// ─── Property-Based Tests ─────────────────────────────────────────────────────

describe('history-manager — property tests', () => {
  beforeEach(() => {
    clearAll();
  });

  /**
   * Property 8: Penyimpanan dan pengambilan riwayat operasi
   * Validates: Requirements 6.1, 6.2, 6.3
   *
   * For any successful operation, after addEntry is called, getEntries must
   * return an entry with all required fields: id, timestamp, type, key, input, output.
   */
  it('Property 8: addEntry stores entry with all required fields', () => {
    // Feature: website-builder, Property 8: Penyimpanan dan pengambilan riwayat operasi
    fc.assert(
      fc.property(operationArbitrary, (operation) => {
        clearAll();
        addEntry(operation);
        const entries = getEntries();

        if (entries.length !== 1) return false;

        const entry = entries[0];
        const requiredFields = ['id', 'timestamp', 'type', 'key', 'input', 'output'];
        return requiredFields.every(f => f in entry);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9: Urutan riwayat kronologis
   * Validates: Requirements 6.4
   *
   * For any sequence of operations, getEntries must return entries sorted
   * from newest to oldest (descending by timestamp).
   */
  it('Property 9: getEntries returns entries sorted newest-first', () => {
    // Feature: website-builder, Property 9: Urutan riwayat kronologis
    fc.assert(
      fc.property(
        fc.array(operationArbitrary, { minLength: 2, maxLength: 20 }),
        (operations) => {
          clearAll();
          operations.forEach(op => addEntry(op));
          const entries = getEntries();

          for (let i = 0; i < entries.length - 1; i++) {
            if (entries[i].timestamp < entries[i + 1].timestamp) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
