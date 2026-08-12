import { createStudent, updateStudent } from "@/lib/actions/people";
import { SubmitButton } from "@/components/submit-button";
import { TextInput, NativeSelect, TextAreaField } from "@/components/forms";
import { GENDERS, STUDENT_STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { StudentFormData } from "./shared";

export function StudentForm({
  student,
  streams,
  mode,
}: {
  student?: StudentFormData | null;
  streams: { id: string; name: string }[];
  mode: "create" | "edit";
}) {
  const action = student
    ? updateStudent.bind(null, student.id)
    : createStudent;

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          name="firstName"
          label="First name"
          required
          defaultValue={student?.firstName}
          placeholder="e.g. Chisomo"
        />
        <TextInput
          name="middleName"
          label="Middle name"
          defaultValue={student?.middleName}
        />
        <TextInput
          name="lastName"
          label="Last name"
          required
          defaultValue={student?.lastName}
          placeholder="e.g. Banda"
        />
        <NativeSelect
          name="gender"
          label="Gender"
          required
          defaultValue={student?.gender}
          options={GENDERS.map((g) => ({ value: g, label: g.toLowerCase() }))}
          placeholder="Select gender"
        />
        <TextInput
          name="dateOfBirth"
          label="Date of birth"
          type="date"
          defaultValue={student?.dateOfBirth ? formatDate(student.dateOfBirth) : undefined}
        />
        <TextInput
          name="nationality"
          label="Nationality"
          defaultValue={student?.nationality ?? "Malawian"}
        />
        <TextInput
          name="admissionNumber"
          label="Admission number"
          hint={mode === "create" ? "Leave blank to auto-generate" : undefined}
          defaultValue={student?.admissionNumber}
        />
        <TextInput
          name="admissionDate"
          label="Admission date"
          type="date"
          defaultValue={student?.admissionDate ? formatDate(student.admissionDate) : undefined}
        />
        <NativeSelect
          name="streamId"
          label="Class / Stream"
          defaultValue={student?.streamId ?? null}
          options={streams.map((s) => ({ value: s.id, label: s.name }))}
          placeholder="Assign to a class stream"
        />
        <TextInput
          name="phone"
          label="Phone"
          defaultValue={student?.phone}
          placeholder="e.g. +265 999 000 000"
        />
        <TextInput
          name="email"
          label="Email"
          type="email"
          defaultValue={student?.email}
        />
        <TextInput
          name="house"
          label="House"
          defaultValue={student?.house}
          placeholder="e.g. Lilongwe House"
        />
        <TextInput
          name="previousSchool"
          label="Previous school"
          defaultValue={student?.previousSchool}
        />
        <NativeSelect
          name="status"
          label="Status"
          defaultValue={student?.status ?? "ACTIVE"}
          options={STUDENT_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ").toLowerCase() }))}
        />
        <TextAreaField
          name="address"
          label="Address"
          defaultValue={student?.address}
          rows={2}
        />
        <TextAreaField
          name="medicalNotes"
          label="Medical notes"
          defaultValue={student?.medicalNotes}
          rows={2}
        />
      </div>
      <div className="flex justify-end gap-2">
        <SubmitButton>{mode === "create" ? "Create student" : "Save changes"}</SubmitButton>
      </div>
    </form>
  );
}
