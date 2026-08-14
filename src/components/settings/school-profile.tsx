"use client";

import { useRouter } from "next/navigation";
import { PencilIcon, XIcon } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { TextInput } from "@/components/forms";
import { SubmitButton } from "@/components/submit-button";
import { updateSchoolProfile } from "@/lib/actions/school";

export type SchoolProfileFormData = {
  name: string;
  motto: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  registrationNumber: string | null;
  currency: string;
  currencySymbol: string;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
};

export function SchoolProfileForm({ school }: { school: SchoolProfileFormData }) {
  const router = useRouter();

  return (
    <ActionForm
      action={updateSchoolProfile}
      className="space-y-4"
      successLabel="School profile updated"
      onSuccess={() => router.refresh()}
    >
      <TextInput name="name" label="School name" defaultValue={school.name} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput name="motto" label="Motto" defaultValue={school.motto} />
        <TextInput name="registrationNumber" label="Registration number" defaultValue={school.registrationNumber} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput name="address" label="Address" defaultValue={school.address} />
        <TextInput name="phone" label="Phone" defaultValue={school.phone} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput name="email" label="Email" type="email" defaultValue={school.email} />
        <TextInput name="website" label="Website" defaultValue={school.website} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput name="currency" label="Currency code" defaultValue={school.currency} hint="e.g. MWK" />
        <TextInput name="currencySymbol" label="Currency symbol" defaultValue={school.currencySymbol} hint="e.g. MK" />
      </div>
      <TextInput name="logo" label="Logo URL" defaultValue={school.logo} hint="Optional image URL shown in the sidebar" />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput name="primaryColor" label="Primary colour" type="color" defaultValue={school.primaryColor} />
        <TextInput name="secondaryColor" label="Secondary colour" type="color" defaultValue={school.secondaryColor} />
      </div>

      <div className="flex justify-end">
        <SubmitButton pendingLabel="Saving…" className="gap-2">
          <PencilIcon className="size-4" /> Save profile
        </SubmitButton>
      </div>
    </ActionForm>
  );
}

export function SchoolProfileView({ school }: { school: SchoolProfileFormData }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {school.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={school.logo} alt="School logo" className="size-10 rounded-lg border object-contain" />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-lg border bg-primary text-primary-foreground">
              {school.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold">{school.name}</p>
            <p className="text-xs text-muted-foreground">{school.motto || "No motto set"}</p>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 sm:flex" style={{ color: school.primaryColor }}>
          <span
            className="inline-block size-3 rounded-full"
            style={{ backgroundColor: school.primaryColor }}
            aria-hidden
          />
          <span
            className="inline-block size-3 rounded-full"
            style={{ backgroundColor: school.secondaryColor }}
            aria-hidden
          />
        </span>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Editing is disabled by the platform administrator.</p>
        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <XIcon className="size-3.5" /> Read-only
        </span>
      </div>
    </div>
  );
}
