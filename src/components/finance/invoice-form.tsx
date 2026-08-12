import { createInvoice } from "@/lib/actions/finance";
import { SubmitButton } from "@/components/submit-button";
import { TextInput, NativeSelect, TextAreaField } from "@/components/forms";

export function InvoiceForm({
  students,
  terms,
}: {
  students: { id: string; name: string }[];
  terms: { id: string; name: string }[];
}) {
  return (
    <form action={createInvoice} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <NativeSelect
          name="studentId"
          label="Student"
          required
          options={students.map((s) => ({ value: s.id, label: s.name }))}
          placeholder="Select student"
          className="sm:col-span-2"
        />
        <NativeSelect
          name="termId"
          label="Term"
          options={terms.map((t) => ({ value: t.id, label: t.name }))}
          placeholder="Select term"
        />
        <TextInput name="dueDate" label="Due date" type="date" />
        <TextInput name="discount" label="Discount (MK)" type="number" min={0} step="0.01" defaultValue={0} />
        <TextAreaField
          name="items"
          label="Invoice items"
          required
          rows={6}
          hint="One item per line in the format: description|amount, e.g. Tuition|250000"
          placeholder={"Tuition|250000\nBoarding|120000"}
          className="sm:col-span-2"
        />
        <TextAreaField
          name="notes"
          label="Notes"
          rows={2}
          className="sm:col-span-2"
        />
      </div>
      <div className="flex justify-end gap-2">
        <SubmitButton>Create invoice</SubmitButton>
      </div>
    </form>
  );
}
