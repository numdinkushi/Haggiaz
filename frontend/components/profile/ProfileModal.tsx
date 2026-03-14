"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/use-profile";
import { uploadProfileImage } from "@/lib/upload-profile";
import { formatAddress } from "@/lib/format";
import { User } from "lucide-react";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MAX_SIZE_MB = 4;

type ProfileModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { address } = useAccount();
  const { profile, updateProfile } = useProfile(address ?? undefined);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync form from Convex profile when modal opens or profile loads
  useEffect(() => {
    if (!open) return;
    setFirstName(profile?.firstName ?? "");
    setLastName(profile?.lastName ?? "");
    setAvatarUrl(profile?.avatarUrl ?? null);
    setPendingFile(null);
  }, [open, profile?.firstName, profile?.lastName, profile?.avatarUrl]);

  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!pendingFile) {
      setFilePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const previewUrl = filePreviewUrl ?? avatarUrl;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error("File too large", { description: `Max ${MAX_SIZE_MB}MB` });
      return;
    }
    setPendingFile(file);
  };

  const handleSave = async () => {
    if (!address) return;
    setSaving(true);
    try {
      let finalAvatarUrl = avatarUrl ?? undefined;
      if (pendingFile) {
        finalAvatarUrl = await uploadProfileImage(pendingFile);
        setAvatarUrl(finalAvatarUrl);
        setPendingFile(null);
      }
      await updateProfile({
        address,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        avatarUrl: finalAvatarUrl,
      });
      toast.success("Profile updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save profile"
      );
    } finally {
      setSaving(false);
    }
  };

  if (!address) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            {formatAddress(address)}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {/* Avatar + upload */}
          <div className="flex flex-col items-center gap-2">
            <Avatar size="lg" className="size-20">
              {previewUrl ? (
                <AvatarImage src={previewUrl} alt="Profile" />
              ) : null}
              <AvatarFallback>
                <User className="size-10 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => inputRef.current?.click()}
              >
                Upload photo
              </Button>
              {(previewUrl || pendingFile) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => {
                    setPendingFile(null);
                    setAvatarUrl(null);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-firstname">First name</Label>
            <Input
              id="profile-firstname"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-lastname">Last name</Label>
            <Input
              id="profile-lastname"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
            />
          </div>
        </div>
        <DialogFooter showCloseButton={false}>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="cursor-pointer"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
