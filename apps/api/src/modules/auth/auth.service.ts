import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { normalizeWalletAddress } from '../../utils/addresses.js';
import { buildAuthMessage } from '../../utils/auth-message.js';
import { ApiError } from '../../utils/api-error.js';
import { randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { recoverMessageAddress } from 'viem';

export async function issueAuthNonce(walletAddressInput: string) {
  const walletAddress = normalizeWalletAddress(walletAddressInput);
  const nonce = randomBytes(16).toString('hex');
  const message = buildAuthMessage(walletAddress, nonce);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.authNonce.upsert({
    where: { walletAddress },
    update: { nonce, message, expiresAt },
    create: { walletAddress, nonce, message, expiresAt }
  });

  return { walletAddress, nonce, message, expiresAt };
}

export async function verifyWalletSignature(walletAddressInput: string, signature: string) {
  const walletAddress = normalizeWalletAddress(walletAddressInput);
  const record = await prisma.authNonce.findUnique({ where: { walletAddress } });

  if (!record) {
    throw ApiError.badRequest('No active nonce was found for this wallet.');
  }

  if (record.expiresAt < new Date()) {
    throw ApiError.badRequest('The authentication nonce has expired. Request a new one.');
  }

  const recoveredAddress = normalizeWalletAddress(
    await recoverMessageAddress({
      message: record.message,
      signature: signature as `0x${string}`
    })
  );

  if (recoveredAddress !== walletAddress) {
    throw ApiError.unauthorized('The supplied signature does not match the wallet address.');
  }

  const organization = await prisma.organization.upsert({
    where: { walletAddress },
    update: {},
    create: {
      walletAddress
    }
  });

  await prisma.authNonce.delete({ where: { walletAddress } });

  const token = jwt.sign(
    {
      sub: organization.id,
      organizationId: organization.id,
      walletAddress: organization.walletAddress,
      role: organization.role
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

  return {
    token,
    organization
  };
}
