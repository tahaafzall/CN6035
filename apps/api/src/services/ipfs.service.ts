import { create as createIpfsClient } from 'ipfs-http-client';

import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';
import { buildFileHash } from '../utils/hash.js';

let ipfsClient: ReturnType<typeof createIpfsClient> | null = null;

function getIpfsClient() {
  if (!env.IPFS_API_URL) {
    throw new ApiError(
      503,
      'IPFS is not configured. Set IPFS_API_URL to enable document uploads.'
    );
  }

  ipfsClient ??= createIpfsClient({ url: env.IPFS_API_URL });
  return ipfsClient;
}

export async function uploadDocumentBuffer(
  buffer: Buffer,
  filename: string,
  mimetype: string
) {
  const client = getIpfsClient();
  const result = await client.add({
    path: filename,
    content: buffer
  });

  const cid = result.cid.toString();

  return {
    cid,
    hash: buildFileHash(buffer),
    filename,
    mimetype,
    size: buffer.byteLength,
    gatewayUrl: `${env.IPFS_GATEWAY_BASE_URL}/${cid}`
  };
}
