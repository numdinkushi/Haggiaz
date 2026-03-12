/**
 * Haggiaz full-flow test using real USDm on forked Alfajores.
 *
 * Run with: FORK_ALFAJORES=1 USDM_ALFAJORES_HOLDER=0x... npx hardhat test test/Haggiaz.usdm.test.ts
 *
 * Get a USDm holder address from https://alfajores.celoscan.io/token/0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b#balances
 * or use the Celo faucet (https://faucet.celo.org) to fund your own address, then use that as holder.
 */
import { expect } from "chai";
import "@nomicfoundation/hardhat-chai-matchers";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ethers } = require("hardhat");

const USDM_ALFAJORES = process.env.USDM_ALFAJORES || "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b";

describe("Haggiaz (USDm on Alfajores fork)", function () {
  this.timeout(60000);

  before(function () {
    if (!process.env.FORK_ALFAJORES) {
      this.skip();
    }
  });

  it("full flow with real USDm", async function () {
    const holder = process.env.USDM_ALFAJORES_HOLDER;
    if (!holder) {
      this.skip();
    }

    const [deployer, alice, bob] = await ethers.getSigners();

    const Haggiaz = await ethers.getContractFactory("Haggiaz");
    const haggiaz = await Haggiaz.deploy();
    await haggiaz.waitForDeployment();
    const treasury = await ethers.getContractAt("HaggiazTreasury", await haggiaz.treasury());

    await haggiaz.setRoundDurationLimits(600, 86400 * 365);

    const CONTRIBUTION = ethers.parseUnits("1", 6);
    const fundAmount = ethers.parseUnits("100", 6);

    await ethers.provider.send("hardhat_impersonateAccount", [holder]);
    await ethers.provider.send("hardhat_setBalance", [holder, "0x" + (1n << 64n).toString(16)]);

    const usdm = await ethers.getContractAt(
      ["function transfer(address to, uint256 amount) returns (bool)", "function balanceOf(address) view returns (uint256)", "function approve(address spender, uint256 amount) returns (bool)"],
      USDM_ALFAJORES
    );
    const signerHolder = await ethers.getSigner(holder);
    await usdm.connect(signerHolder).transfer(deployer.address, fundAmount);
    await usdm.connect(signerHolder).transfer(alice.address, fundAmount);
    await usdm.connect(signerHolder).transfer(bob.address, fundAmount);

    await ethers.provider.send("hardhat_stopImpersonatingAccount", [holder]);

    await usdm.connect(deployer).approve(await treasury.getAddress(), ethers.MaxUint256);
    await usdm.connect(alice).approve(await treasury.getAddress(), ethers.MaxUint256);
    await usdm.connect(bob).approve(await treasury.getAddress(), ethers.MaxUint256);

    const tx = await haggiaz.createGroup(USDM_ALFAJORES, CONTRIBUTION, 3, 600);
    const receipt = await tx.wait();
    const createdEvent = receipt?.logs
      ?.map((l: any) => {
        try {
          return haggiaz.interface.parseLog(l);
        } catch {
          return null;
        }
      })
      .find((e: any) => e?.name === "GroupCreated");
    const groupId = createdEvent?.args?.[0];

    await haggiaz.connect(alice).join(groupId);
    await haggiaz.connect(bob).join(groupId);
    await haggiaz.startGroup(groupId);

    for (let r = 1; r <= 3; r++) {
      await haggiaz.connect(deployer).contribute(groupId);
      await haggiaz.connect(alice).contribute(groupId);
      await haggiaz.connect(bob).contribute(groupId);
      const recipient = await haggiaz.getRecipientForRound(groupId, r);
      const recipientSigner = [deployer, alice, bob].find((s) => s.address === recipient);
      await haggiaz.connect(recipientSigner).disburse(groupId);
    }

    expect(await haggiaz.getStatus(groupId)).to.equal(2);
    expect(await treasury.getBalance(groupId, USDM_ALFAJORES)).to.equal(0);
  });
});
