import { BatchStatus, ParticipantRole, PrismaClient } from '@prisma/client';
import { buildDocumentHashFromCid, buildMetadataHash } from '../src/utils/hash.js';
import { normalizeWalletAddress } from '../src/utils/addresses.js';

const prisma = new PrismaClient();

async function main() {
  const demoOrganizations = [
    {
      walletAddress: normalizeWalletAddress('0x70997970C51812dc3A010C7d01b50e0d17dc79C8'),
      name: 'NovaBio Manufacturing',
      role: ParticipantRole.MANUFACTURER,
      contactEmail: 'ops@novabio.example',
      location: 'Basel, Switzerland',
      complianceId: 'EU-GMP-8472'
    },
    {
      walletAddress: normalizeWalletAddress('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'),
      name: 'ColdLoop Logistics',
      role: ParticipantRole.LOGISTICS,
      contactEmail: 'fleet@coldloop.example',
      location: 'Rotterdam, Netherlands',
      complianceId: 'GDP-TRK-219'
    },
    {
      walletAddress: normalizeWalletAddress('0x90F79bf6EB2c4f870365E785982E1f101E93b906'),
      name: 'EuroMed Distribution',
      role: ParticipantRole.DISTRIBUTOR,
      contactEmail: 'hub@euromed.example',
      location: 'Frankfurt, Germany',
      complianceId: 'EU-WHS-991'
    },
    {
      walletAddress: normalizeWalletAddress('0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'),
      name: 'CityCare Pharmacy',
      role: ParticipantRole.PHARMACY,
      contactEmail: 'supply@citycare.example',
      location: 'Manchester, United Kingdom',
      complianceId: 'UK-PH-551'
    },
    {
      walletAddress: normalizeWalletAddress('0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc'),
      name: 'Medicines Safety Office',
      role: ParticipantRole.REGULATOR,
      contactEmail: 'alerts@mso.example',
      location: 'London, United Kingdom',
      complianceId: 'REG-AUTH-01'
    }
  ];

  for (const org of demoOrganizations) {
    await prisma.organization.upsert({
      where: { walletAddress: org.walletAddress },
      update: {
        ...org,
        isProfileComplete: true
      },
      create: {
        ...org,
        isProfileComplete: true
      }
    });
  }

  const manufacturer = await prisma.organization.findUniqueOrThrow({
    where: { walletAddress: normalizeWalletAddress('0x70997970C51812dc3A010C7d01b50e0d17dc79C8') }
  });

  const batchCode = 'BATCH-SEED-001';
  const metadataHash = buildMetadataHash({
    batchCode,
    productName: 'mRNA Vaccine 50mcg',
    category: 'Vaccines',
    description: 'Demo seed batch for dashboard and verification screenshots.',
    originCountry: 'Switzerland',
    destinationMarket: 'United Kingdom',
    unitCount: 1200
  });

  await prisma.batch.upsert({
    where: { batchCode },
    update: {},
    create: {
      batchCode,
      productName: 'mRNA Vaccine 50mcg',
      category: 'Vaccines',
      description: 'Demo seed batch for dashboard and verification screenshots.',
      originCountry: 'Switzerland',
      destinationMarket: 'United Kingdom',
      unitCount: 1200,
      storageTempMin: 2,
      storageTempMax: 8,
      manufacturedAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
      metadataCid: null,
      metadataHash,
      documentCid: null,
      documentHash: buildDocumentHashFromCid(null),
      status: BatchStatus.DRAFT,
      manufacturerId: manufacturer.id,
      currentCustodianId: manufacturer.id
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
