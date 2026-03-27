import { keccak256, stringToHex } from 'viem';

export function buildShipmentHash(
  batchCode: string,
  toWalletAddress: string,
  shipmentReference: string
) {
  return keccak256(
    stringToHex(`${batchCode}|${toWalletAddress.toLowerCase()}|${shipmentReference}`)
  );
}

export function buildTextHash(value: string) {
  return keccak256(stringToHex(value));
}
