"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { motion } from "framer-motion";
import { ROUTES } from "@/lib/constants";
import { CONFIG } from "@/lib/config";
import { useCreateGroup } from "@/hooks/use-haggiaz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ANIMATION } from "@/lib/constants";
import { TOKEN_DECIMALS } from "@/lib/constants";

export default function CreateGroupPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { createGroup, isPending, isSuccess, error } = useCreateGroup();

  const [name, setName] = useState("");
  const [contribution, setContribution] = useState("10");
  const [maxMembers, setMaxMembers] = useState("5");
  const [roundDurationDays, setRoundDurationDays] = useState("7");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contribution || !maxMembers || !roundDurationDays) return;

    const contributionAmount = parseUnits(contribution, TOKEN_DECIMALS);
    const roundDurationSeconds = parseInt(roundDurationDays, 10) * 86400;

    createGroup({
      name: name.trim(),
      token: CONFIG.usdm,
      contributionAmount,
      maxMembers: parseInt(maxMembers, 10),
      roundDurationSeconds,
    });
  };

  if (isSuccess) {
    router.push(ROUTES.GROUPS);
    return null;
  }

  return (
    <div className="min-h-svh px-6 pt-28 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: ANIMATION.DURATION_NORMAL }}
        className="mx-auto max-w-md"
      >
        <Card>
          <CardHeader>
            <CardTitle>Create a group</CardTitle>
            <CardDescription>
              Start a new ROSCA/Chama savings group on Celo. Members contribute USDm each round.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <p className="text-center text-muted-foreground">Connect your wallet to create a group.</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name">Group name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Family Chama"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={64}
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="contribution">Contribution per round (USDm)</Label>
                  <Input
                    id="contribution"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="10"
                    value={contribution}
                    onChange={(e) => setContribution(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="maxMembers">Max members</Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    min="2"
                    max="100"
                    placeholder="5"
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="roundDuration">Round duration (days)</Label>
                  <Input
                    id="roundDuration"
                    type="number"
                    min="1"
                    placeholder="7"
                    value={roundDurationDays}
                    onChange={(e) => setRoundDurationDays(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error.message}</p>}
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? "Creating…" : "Create group"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
