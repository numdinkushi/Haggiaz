import { expect } from "chai";
import "@nomicfoundation/hardhat-chai-matchers";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ethers } = require("hardhat");

describe("Haggiaz", function () {
  let haggiaz: Awaited<ReturnType<typeof ethers.deployContract>>;
  let treasury: Awaited<ReturnType<typeof ethers.getContractAt>>;
  let token: Awaited<ReturnType<typeof ethers.deployContract>>;
  let owner: { address: string };
  let alice: { address: string };
  let bob: { address: string };

  const CONTRIBUTION = ethers.parseUnits("10", 6);
  const MAX_MEMBERS = 3;
  const ROUND_DURATION = 86400; // 1 day

  before(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("Test USD", "TUSD", 6);
    await token.waitForDeployment();
    await token.mint(owner.address, ethers.parseUnits("1000", 6));
    await token.mint(alice.address, ethers.parseUnits("1000", 6));
    await token.mint(bob.address, ethers.parseUnits("1000", 6));

    const Haggiaz = await ethers.getContractFactory("Haggiaz");
    const h = await Haggiaz.deploy();
    await h.waitForDeployment();
    haggiaz = h;
    treasury = await ethers.getContractAt("HaggiazTreasury", await h.treasury());
  });

  it("deploys Haggiaz and Treasury", async function () {
    expect(await haggiaz.getAddress()).to.match(/^0x[a-fA-F0-9]{40}$/);
    expect(await treasury.getAddress()).to.match(/^0x[a-fA-F0-9]{40}$/);
  });

  it("creates a group", async function () {
    await expect(
      haggiaz.createGroup(
        "Test Group",
        await token.getAddress(),
        CONTRIBUTION,
        MAX_MEMBERS,
        ROUND_DURATION
      )
    ).to.not.be.reverted;

    const filter = haggiaz.filters.GroupCreated();
    const events = await haggiaz.queryFilter(filter, -1);
    const groupId = events[events.length - 1]?.args?.[0];
    expect(await haggiaz.groupExists(groupId)).to.be.true;
  });

  it("allows owner to set round duration limits for testing (e.g. 10 mins)", async function () {
    const tenMins = 600;
    await expect(haggiaz.setRoundDurationLimits(tenMins, ROUND_DURATION)).to.not.be.reverted;
    expect(await haggiaz.minRoundDurationSeconds()).to.equal(tenMins);

    await expect(
      haggiaz.createGroup(
        "Short Round Group",
        await token.getAddress(),
        CONTRIBUTION,
        MAX_MEMBERS,
        tenMins
      )
    ).to.not.be.reverted;
  });

  it("owner can pause and unpause", async function () {
    await expect(haggiaz.pause()).to.not.be.reverted;
    expect(await haggiaz.paused()).to.be.true;
    await expect(
      haggiaz.createGroup("Paused Group", await token.getAddress(), CONTRIBUTION, MAX_MEMBERS, ROUND_DURATION)
    ).to.be.reverted;
    await expect(haggiaz.unpause()).to.not.be.reverted;
    expect(await haggiaz.paused()).to.be.false;
  });

  it("rejects EOA as token (must be contract)", async function () {
    await expect(
      haggiaz.createGroup("Bad Token Group", alice.address, CONTRIBUTION, MAX_MEMBERS, ROUND_DURATION)
    ).to.be.revertedWithCustomError(haggiaz, "TokenMustBeContract");
  });

  it("invite-only group requires joinWithSignature", async function () {
    const createGroupInviteOnly = haggiaz.getFunction("createGroup(string,address,uint256,uint256,uint256,bool)");
    await expect(
      createGroupInviteOnly(
        "Invite Only Group",
        await token.getAddress(),
        CONTRIBUTION,
        MAX_MEMBERS,
        ROUND_DURATION,
        true
      )
    ).to.not.be.reverted;

    const filter = haggiaz.filters.GroupCreated();
    const events = await haggiaz.queryFilter(filter, -1);
    const groupId = events[events.length - 1]?.args?.[0];
    expect(await haggiaz.inviteOnly(groupId)).to.be.true;

    await expect(haggiaz.connect(alice).join(groupId)).to.be.revertedWithCustomError(
      haggiaz,
      "InviteOnlyUseSignature"
    );
  });

  it("joinWithSignature works with valid creator signature", async function () {
    const createGroupInviteOnly = haggiaz.getFunction("createGroup(string,address,uint256,uint256,uint256,bool)");
    await expect(
      createGroupInviteOnly(
        "Invite Sig Group",
        await token.getAddress(),
        CONTRIBUTION,
        MAX_MEMBERS,
        ROUND_DURATION,
        true
      )
    ).to.not.be.reverted;

    const filter = haggiaz.filters.GroupCreated();
    const events = await haggiaz.queryFilter(filter, -1);
    const groupId = events[events.length - 1]?.args?.[0];

    const nonce = 1;
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const domain = {
      name: "Haggiaz",
      version: "1",
      chainId: (await haggiaz.runner?.provider?.getNetwork())?.chainId ?? 31337n,
      verifyingContract: await haggiaz.getAddress(),
    };
    const types = {
      JoinInvite: [
        { name: "groupId", type: "bytes32" },
        { name: "member", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };
    const value = {
      groupId,
      member: alice.address,
      nonce: BigInt(nonce),
      deadline: BigInt(deadline),
    };

    const signature = await owner.signTypedData(domain, types, value);
    const sig = ethers.Signature.from(signature);

    await expect(
      haggiaz.connect(alice).joinWithSignature(groupId, nonce, deadline, sig.v, sig.r, sig.s)
    ).to.not.be.reverted;

    const members = await haggiaz.getMembers(groupId);
    expect(members).to.include(alice.address);
  });

  it("full flow: create → join → start → contribute (all) → disburse each round until completion", async function () {
    const tenMins = 600;
    await haggiaz.setRoundDurationLimits(tenMins, ROUND_DURATION);

    const treasuryAddr = await haggiaz.treasury();
    const approveAmount = ethers.MaxUint256;
    await token.connect(owner).approve(treasuryAddr, approveAmount);
    await token.connect(alice).approve(treasuryAddr, approveAmount);
    await token.connect(bob).approve(treasuryAddr, approveAmount);

    const tx = await haggiaz.createGroup(
      "Full Flow Group",
      await token.getAddress(),
      CONTRIBUTION,
      MAX_MEMBERS,
      tenMins
    );
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

    const membersBeforeStart = await haggiaz.getMembers(groupId);
    expect(membersBeforeStart.length).to.equal(3);
    expect(membersBeforeStart).to.include(owner.address);
    expect(membersBeforeStart).to.include(alice.address);
    expect(membersBeforeStart).to.include(bob.address);

    await haggiaz.startGroup(groupId);
    expect(await haggiaz.getStatus(groupId)).to.equal(1); // Active

    const numRounds = 3;
    for (let r = 1; r <= numRounds; r++) {
      expect(await haggiaz.getCurrentRound(groupId)).to.equal(r);

      await haggiaz.connect(owner).contribute(groupId);
      await haggiaz.connect(alice).contribute(groupId);
      await haggiaz.connect(bob).contribute(groupId);

      const recipient = await haggiaz.getRecipientForRound(groupId, r);
      const recipientSigner = [owner, alice, bob].find((s) => s.address === recipient);
      const balBefore = await token.balanceOf(recipient);

      await haggiaz.connect(recipientSigner).disburse(groupId);

      const pot = CONTRIBUTION * BigInt(3);
      const balAfter = await token.balanceOf(recipient);
      expect(balAfter - balBefore).to.equal(pot);
    }

    expect(await haggiaz.getStatus(groupId)).to.equal(2); // Completed
    expect(await haggiaz.getPotBalance(groupId)).to.equal(0);
  });
});
