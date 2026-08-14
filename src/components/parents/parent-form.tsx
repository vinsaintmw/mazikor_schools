import { createParent, updateParent } from "@/lib/actions/people";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { CancelButton } from "@/components/cancel-button";
import { TextInput } from "@/components/forms";
import { NativeSelect } from "@/components/forms";

export interface ParentFormData {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  address: string | null;
  occupation: string | null;
  relationship: string;
  isEmergency: boolean;
}

export function ParentForm({
  parent,
  mode,
}: {
  parent?: ParentFormData | null;
  mode: "create" | "edit";
}) {
  const action = async (formData: FormData) => {
    if (parent) await updateParent(parent.id, formData);
    else await createParent(formData);
  };

  return (
    <ActionForm action={action} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput name="firstName" label="First name" required defaultValue={parent?.firstName} />
        <TextInput name="lastName" label="Last name" required defaultValue={parent?.lastName} />
        <TextInput name="phone" label="Phone" required defaultValue={parent?.phone} placeholder="e.g. +265 999 000 000" />
        <TextInput name="email" label="Email" type="email" defaultValue={parent?.email} />
        <TextInput name="occupation" label="Occupation" defaultValue={parent?.occupation} />
        <NativeSelect
          name="relationship"
          label="Relationship"
          required
          defaultValue={parent?.relationship}
          options={[
            { value: "Mother", label: "Mother" },
            { value: "Father", label: "Father" },
            { value: "Guardian", label: "Guardian" },
            { value: "Aunt", label: "Aunt" },
            { value: "Uncle", label: "Uncle" },
            { value: "Sibling", label: "Sibling" },
            { value: "Other", label: "Other" },
          ]}
          placeholder="Select relationship"
        />
        <TextInput name="address" label="Address" defaultValue={parent?.address} className="sm:col-span-2" />
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="isEmergency" defaultChecked={parent?.isEmergency} className="size-4 rounded border-input accent-primary" />
          Emergency contact
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <CancelButton href={parent ? `/parents/${parent.id}` : "/parents"} />
        <SubmitButton>{mode === "create" ? "Create parent" : "Save changes"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
