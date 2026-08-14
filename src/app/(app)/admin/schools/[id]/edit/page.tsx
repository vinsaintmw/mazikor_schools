import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/action-form";
import { TextInput, NativeSelect } from "@/components/forms";
import { SubmitButton } from "@/components/submit-button";
import { updateSchoolSettings } from "@/lib/actions/super-admin";

export const metadata = { title: "Edit school" };

const SCHOOL_TYPES = ["PRIMARY", "SECONDARY", "COLLEGE", "TERTIARY", "OTHER"];

export default async function AdminEditSchoolPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleKey !== "super_admin") redirect("/dashboard");

  const { id } = await params;
  const school = await db.school.findUnique({ where: { id } });
  if (!school) notFound();

  return (
    <div className="space-y-4">
      <PageHeader title={`Edit ${school.name}`} description="Core details are managed here. Branding and currency are handled by the school administrator in Settings.">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/schools/${school.id}`}>Cancel</Link>
        </Button>
      </PageHeader>

      <ActionForm
        action={updateSchoolSettings}
        className="max-w-3xl space-y-4 rounded-2xl border bg-card p-6 sm:p-8"
        successLabel="School updated"
      >
        <input type="hidden" name="schoolId" value={school.id} />
        <TextInput name="name" label="School name" defaultValue={school.name} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput name="code" label="School code" defaultValue={school.code} required />
          <TextInput name="slug" label="Slug" defaultValue={school.slug} hint="Read-only. Set at creation." disabled />
        </div>
        <NativeSelect
          name="type"
          label="School type"
          placeholder="Select type"
          options={SCHOOL_TYPES}
          defaultValue={school.type}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput name="address" label="Address" defaultValue={school.address} />
          <TextInput name="district" label="District" defaultValue={school.district} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput name="region" label="Region" defaultValue={school.region} />
          <TextInput name="country" label="Country" defaultValue={school.country} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput name="phone" label="Phone" defaultValue={school.phone} />
          <TextInput name="email" label="Email" type="email" defaultValue={school.email} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput name="website" label="Website" defaultValue={school.website} />
          <TextInput name="registrationNumber" label="Registration number" defaultValue={school.registrationNumber} />
        </div>
        <TextInput name="motto" label="Motto" defaultValue={school.motto} />

        <div className="flex justify-end gap-2 border-t pt-6">
          <Button variant="outline" type="button" asChild>
            <Link href={`/admin/schools/${school.id}`}>Cancel</Link>
          </Button>
          <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}
