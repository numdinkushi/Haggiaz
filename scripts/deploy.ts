import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { TOKEN_ADDRESSES } from "../config/addresses";

const ADDRESSES_PATH = path.join(__dirname, "..", "addresses.json");

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer account. Set PRIVATE_KEY in .env");
  }
  console.log("Deploying Haggiaz with account:", deployer.address);

  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  const Haggiaz = await ethers.getContractFactory("Haggiaz");
  const haggiaz = await Haggiaz.deploy();
  await haggiaz.waitForDeployment();

  const haggiazAddress = await haggiaz.getAddress();
  const treasuryAddress = await haggiaz.treasury();

  console.log("\n--- Deployment complete ---");
  console.log("Haggiaz:", haggiazAddress);
  console.log("HaggiazTreasury:", treasuryAddress);

  let addresses: Record<string, any>;
  try {
    addresses = JSON.parse(fs.readFileSync(ADDRESSES_PATH, "utf8"));
  } catch {
    addresses = {
      celoTestnet: { haggiaz: "", treasury: "" },
      celoMainnet: { haggiaz: "", treasury: "" },
      tokens: {
        celoTestnet: { usdc: TOKEN_ADDRESSES.celoTestnet.usdc },
        celoMainnet: { usdc: TOKEN_ADDRESSES.celoMainnet.usdc },
      },
    };
  }

  const key = chainId === 44787 ? "celoTestnet" : chainId === 42220 ? "celoMainnet" : "local";
  if (!addresses[key]) addresses[key] = {};
  addresses[key].haggiaz = haggiazAddress;
  addresses[key].treasury = treasuryAddress;
  fs.writeFileSync(ADDRESSES_PATH, JSON.stringify(addresses, null, 2));
  console.log("\nSaved to addresses.json");

  console.log("\n--- Save for frontend ---");
  console.log("HAGGAZ_ADDRESS=", haggiazAddress);
  console.log("HAGGAZ_TREASURY_ADDRESS=", treasuryAddress);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
