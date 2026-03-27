import { keccak256, stringToHex, toHex, zeroHash } from 'viem';

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left.localeCompare(right)
    );

    return `{${entries
      .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableStringify(nestedValue)}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

export function buildMetadataHash(payload: Record<string, unknown>) {
  return keccak256(stringToHex(stableStringify(payload)));
}

export function buildDocumentHashFromCid(cid: string | null | undefined) {
  return cid ? keccak256(stringToHex(cid)) : zeroHash;
}

export function buildShipmentHash(payload: {
  batchCode: string;
  toWalletAddress: string;
  shipmentReference: string;
}) {
  return keccak256(
    stringToHex(
      `${payload.batchCode}|${payload.toWalletAddress.toLowerCase()}|${payload.shipmentReference}`
    )
  );
}

export function buildCheckpointHash(payload: {
  batchCode: string;
  temperatureC?: number;
  humidityPercent?: number;
  location?: string;
  recordedAt: string;
}) {
  return keccak256(stringToHex(stableStringify(payload)));
}

export function buildFileHash(buffer: Buffer) {
  return keccak256(toHex(buffer));
}
