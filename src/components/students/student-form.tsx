"use client";

import { createStudent, updateStudent } from "@/lib/actions/people";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { CancelButton } from "@/components/cancel-button";
import { TextInput, NativeSelect, TextAreaField } from "@/components/forms";
import { GENDERS, STUDENT_STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export type StudentFormData = {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  gender: string;
  dateOfBirth?: Date | null;
  nationality?: string | null;
  admissionNumber?: string | null;
  admissionDate?: Date | null;
  streamId?: string | null;
  phone?: string | null;
  email?: string | null;
  house?: string | null;
  previousSchool?: string | null;
  address?: string | null;
  medicalNotes?: string | null;
  status: string;
};

export function StudentForm({
  student,
  streams,
  mode,
}: {
  student?: StudentFormData | null;
  streams: { id: string; name: string }[];
  mode: "create" | "edit";
}) {
  const initialData: Partial<StudentFormData> = mode === "create" ? {} : (student ?? {});

  const action = async (formData: FormData) =>
    mode === "create" ? createStudent(formData) : updateStudent(student?.id ?? "", formData);

  return (
    <ActionForm
      action={action}
      className="space-y-6"
      successLabel={mode === "create" ? "Student created" : "Changes saved"}
    >
      <input type="hidden" name="studentId" value={student?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          name="firstName"
          label="First name"
          required
          defaultValue={initialData.firstName}
          placeholder="e.g. Chisomo"
        />
        <TextInput
          name="middleName"
          label="Middle name"
          defaultValue={initialData.middleName}
        />
        <TextInput
          name="lastName"
          label="Last name"
          required
          defaultValue={initialData.lastName}
          placeholder="e.g. Banda"
        />
        <NativeSelect
          name="gender"
          label="Gender"
          required
          defaultValue={initialData.gender}
          options={GENDERS.map((g) => ({ value: g, label: g.toLowerCase() }))}
          placeholder="Select gender"
        />
        <TextInput
          name="dateOfBirth"
          label="Date of birth"
          type="date"
          defaultValue={initialData.dateOfBirth ? formatDate(initialData.dateOfBirth) : undefined}
        />
        <TextInput
          name="nationality"
          label="Nationality"
          defaultValue={initialData.nationality ?? "Malawian"}
        />
        <TextInput
          name="admissionNumber"
          label="Admission number"
          hint={mode === "create" ? "Leave blank to auto-generate" : undefined}
          defaultValue={initialData.admissionNumber}
        />
        <TextInput
          name="admissionDate"
          label="Admission date"
          type="date"
          defaultValue={initialData.admissionDate ? formatDate(initialData.admissionDate) : undefined}
        />
        <NativeSelect
          name="streamId"
          label="Class / Stream"
          defaultValue={initialData.streamId ?? null}
          options={streams.map((s) => ({ value: s.id, label: s.name }))}
          placeholder="Assign to a class stream"
        />
        <TextInput
          name="phone"
          label="Phone"
          defaultValue={initialData.phone}
          placeholder="e.g. +265 999 000 000"
        />
        <TextInput
          name="email"
          label="Email"
          type="email"
          defaultValue={initialData.email}
        />
        <TextInput
          name="house"
          label="House"
          defaultValue={initialData.house}
          placeholder="e.g. Lilongwe House"
        />
        <TextInput
          name="previousSchool"
          label="Previous school"
          defaultValue={initialData.previousSchool}
        />
        <NativeSelect
          name="status"
          label="Status"
          defaultValue={initialData.status ?? "ACTIVE"}
          options={STUDENT_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ").toLowerCase() }))}
        />
        <TextAreaField
          name="address"
          label="Address"
          defaultValue={initialData.address}
          rows={2}
        />
        <TextAreaField
          name="medicalNotes"
          label="Medical notes"
          defaultValue={initialData.medicalNotes}
          rows={2}
        />
      </div>
      <div className="flex justify-end gap-2">
        <CancelButton href={student ? `/students/${student.id}` : "/students"} />
        <SubmitButton>{mode === "create" ? "Create student" : "Save changes"}</SubmitButton>
      </div>
    </ActionForm>
  );
}