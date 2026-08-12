import { createTeacher, updateTeacher } from "@/lib/actions/people";
import { SubmitButton } from "@/components/submit-button";
import { TextInput, NativeSelect, TextAreaField } from "@/components/forms";
import { GENDERS, EMPLOYMENT_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export interface TeacherFormData {
  id: string;
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE";
  dateOfBirth: Date | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  qualification: string | null;
  specialization: string | null;
  joiningDate: Date | null;
  employmentType: string;
  salary: number;
  status: string;
}

export function TeacherForm({
  teacher,
  mode,
}: {
  teacher?: TeacherFormData | null;
  mode: "create" | "edit";
}) {
  const action = teacher ? updateTeacher.bind(null, teacher.id) : createTeacher;

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput name="firstName" label="First name" required defaultValue={teacher?.firstName} />
        <TextInput name="lastName" label="Last name" required defaultValue={teacher?.lastName} />
        <NativeSelect
          name="gender"
          label="Gender"
          required
          defaultValue={teacher?.gender ?? null}
          options={GENDERS.map((g) => ({ value: g, label: g.toLowerCase() }))}
          placeholder="Select gender"
        />
        <TextInput name="dateOfBirth" label="Date of birth" type="date" defaultValue={teacher?.dateOfBirth ? formatDate(teacher.dateOfBirth) : undefined} />
        <TextInput name="phone" label="Phone" defaultValue={teacher?.phone} />
        <TextInput name="email" label="Email" type="email" defaultValue={teacher?.email} />
        <TextInput name="qualification" label="Qualification" defaultValue={teacher?.qualification} placeholder="e.g. B.Ed (Mathematics)" className="sm:col-span-2" />
        <TextInput name="specialization" label="Specialisation" defaultValue={teacher?.specialization} placeholder="e.g. Mathematics" />
        <TextInput name="joiningDate" label="Joining date" type="date" defaultValue={teacher?.joiningDate ? formatDate(teacher.joiningDate) : undefined} />
        <NativeSelect
          name="employmentType"
          label="Employment type"
          defaultValue={teacher?.employmentType ?? "FULL_TIME"}
          options={EMPLOYMENT_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, " ").toLowerCase() }))}
        />
        <TextInput name="salary" label="Salary (MK)" type="number" step="0.01" min={0} defaultValue={teacher?.salary ?? 0} />
        <NativeSelect
          name="status"
          label="Status"
          defaultValue={teacher?.status ?? "ACTIVE"}
          options={["ACTIVE", "ON_LEAVE", "RESIGNED", "TERMINATED"].map((s) => ({ value: s, label: s.replace(/_/g, " ").toLowerCase() }))}
        />
        <TextAreaField name="address" label="Address" defaultValue={teacher?.address} rows={2} className="sm:col-span-2" />
      </div>
      <div className="flex justify-end gap-2">
        <SubmitButton>{mode === "create" ? "Create teacher" : "Save changes"}</SubmitButton>
      </div>
    </form>
  );
}
