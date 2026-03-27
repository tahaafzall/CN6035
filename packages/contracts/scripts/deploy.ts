import { config as loadEnv } from 'dotenv';
import { ethers, network } from 'hardhat';
import path from 'node:path';

loadEnv({ path: path.resolve(__dirname, '..', '.env') });

type RoleTarget = {
  label: string;
  roleKey:
    | 'MANUFACTURER_ROLE'
    | 'LOGISTICS_ROLE'
    | 'DISTRIBUTOR_ROLE'
    | 'PHARMACY_ROLE'
    | 'REGULATOR_ROLE';
  address: string;
};

function resolveRoleAddress(envValue: string | undefined, fallback: string | undefined) {
  if (
    envValue &&
    envValue !== ethers.ZeroAddress &&
    !envValue.includes('0000000000000000000000000000000000000000')
  ) {
    return envValue;
  }

  return fallback || ethers.ZeroAddress;
}

async function main() {
  const signers = await ethers.getSigners();
  const [deployer, manufacturer, logistics, distributor, pharmacy, regulator] = signers;

  const contractFactory = await ethers.getContractFactory('PharmaTrace');
  const contract = await contractFactory.deploy(deployer.address);
  await contract.waitForDeployment();

  const deployedAddress = await contract.getAddress();

  const roleTargets: RoleTarget[] = [
    {
      label: 'manufacturer',
      roleKey: 'MANUFACTURER_ROLE',
      address: resolveRoleAddress(process.env.MANUFACTURER_ADDRESS, manufacturer?.address)
    },
    {
      label: 'logistics',
      roleKey: 'LOGISTICS_ROLE',
      address: resolveRoleAddress(process.env.LOGISTICS_ADDRESS, logistics?.address)
    },
    {
      label: 'distributor',
      roleKey: 'DISTRIBUTOR_ROLE',
      address: resolveRoleAddress(process.env.DISTRIBUTOR_ADDRESS, distributor?.address)
    },
    {
      label: 'pharmacy',
      roleKey: 'PHARMACY_ROLE',
      address: resolveRoleAddress(process.env.PHARMACY_ADDRESS, pharmacy?.address)
    },
    {
      label: 'regulator',
      roleKey: 'REGULATOR_ROLE',
      address: resolveRoleAddress(process.env.REGULATOR_ADDRESS, regulator?.address)
    }
  ];

  for (const target of roleTargets) {
    if (target.address !== ethers.ZeroAddress) {
      const roleId = await contract[target.roleKey]();
      const tx = await contract.grantSupplyChainRole(target.address, roleId);
      await tx.wait();
    }
  }

  console.log(
    JSON.stringify(
      {
        network: network.name,
        chainId: network.config.chainId,
        contractAddress: deployedAddress,
        deployer: deployer.address,
        roleTargets
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
