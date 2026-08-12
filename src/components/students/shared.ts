export interface StudentFormData {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: "MALE" | "FEMALE";
  dateOfBirth: Date | null;
  nationality: string;
  admissionNumber: string;
  admissionDate: Date;
  streamId: string | null;
  phone: string | null;
  email: string | null;
  house: string | null;
  previousSchool: string | null;
  address: string | null;
  medicalNotes: string | null;
  status: string;
}
