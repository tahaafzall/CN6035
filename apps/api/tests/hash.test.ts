import { describe, expect, it } from 'vitest';

import {
  buildDocumentHashFromCid,
  buildMetadataHash,
  buildShipmentHash
} from '../src/utils/hash.js';

describe('hash helpers', () => {
  it('builds deterministic metadata hashes', () => {
    const first = buildMetadataHash({ batchCode: 'A', unitCount: 10, nested: { ok: true } });
    const second = buildMetadataHash({ nested: { ok: true }, unitCount: 10, batchCode: 'A' });

    expect(first).toBe(second);
  });

  it('returns zero hash when there is no document cid', () => {
    expect(buildDocumentHashFromCid(null)).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000000'
    );
  });

  it('changes shipment hash when the recipient changes', () => {
    const first = buildShipmentHash({
      batchCode: 'A',
      toWalletAddress: '0x1111111111111111111111111111111111111111',
      shipmentReference: 'REF-1'
    });
    const second = buildShipmentHash({
      batchCode: 'A',
      toWalletAddress: '0x2222222222222222222222222222222222222222',
      shipmentReference: 'REF-1'
    });

    expect(first).not.toBe(second);
  });
});
