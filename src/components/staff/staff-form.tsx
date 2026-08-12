import { createStaff, updateStaff } from "@/lib/actions/people";
import { SubmitButton } from "@/components/submit-button";
import { TextInput, NativeSelect, TextAreaField } from "@/components/forms";
import { GENDERS, EMPLOYMENT_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export interface StaffFormData {
  id: string;
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE";
  phone: string | null;
  email: string | null;
  address: string | null;
  position: string | null;
  department: string | null;
  joiningDate: Date | null;
  employmentType: string;
  salary: number;
  status: string;
}

export function StaffForm({
  staff,
  mode,
}: {
  staff?: StaffFormData | null;
  mode: "create" | "edit";
}) {
  const action = staff ? updateStaff.bind(null, staff.id) : createStaff;

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput name="firstName" label="First name" required defaultValue={staff?.firstName} />
        <TextInput name="lastName" label="Last name" required defaultValue={staff?.lastName} />
        <NativeSelect
          name="gender"
          label="Gender"
          required
          defaultValue={staff?.gender ?? null}
          options={GENDERS.map((g) => ({ value: g, label: g.toLowerCase() }))}
          placeholder="Select gender"
        />
        <TextInput name="phone" label="Phone" defaultValue={staff?.phone} />
        <TextInput name="email" label="Email" type="email" defaultValue={staff?.email} />
        <TextInput name="position" label="Position" defaultValue={staff?.position} placeholder="e.g. School Secretary" />
        <TextInput name="department" label="Department" defaultValue={staff?.department} placeholder="e.g. Administration" />
        <TextInput name="joiningDate" label="Joining date" type="date" defaultValue={staff?.joiningDate ? formatDate(staff.joiningDate) : undefined} />
        <NativeSelect
          name="employmentType"
          label="Employment type"
          defaultValue={staff?.employmentType ?? "FULL_TIME"}
          options={EMPLOYMENT_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, " ").toLowerCase() }))}
        />
        <TextInput name="salary" label="Salary (MK)" type="number" step="0.01" min={0} defaultValue={staff?.salary ?? 0} />
        <NativeSelect
          name="status"
          label="Status"
          defaultValue={staff?.status ?? "ACTIVE"}
          options={["ACTIVE", "ON_LEAVE", "RESIGNED", "TERMINATED"].map((s) => ({ value: s, label: s.replace(/_/g, " ").toLowerCase() }))}
        />
        <TextAreaField name="address" label="Address" defaultValue={staff?.address} rows={2} className="sm:col-span-2" />
      </div>
      <div className="flex justify-end gap-2">
        <SubmitButton>{mode === "create" ? "Create staff" : "Save changes"}</SubmitButton>
      </div>
    </form>
  );
}
