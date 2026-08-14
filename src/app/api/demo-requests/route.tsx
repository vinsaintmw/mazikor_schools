import { z } from "zod";
import { db } from "@/lib/db";

const demoRequestSchema = z.object({
  schoolName: z.string().trim().min(2, "School name is required").max(120),
  contactPerson: z.string().trim().min(2, "Contact person is required").max(120),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20, "Phone number is too long")
    .regex(/^[+()\d\s-]+$/, "Phone number contains invalid characters"),
  email: z.string().trim().email("Enter a valid email address").max(160),
  numStudents: z.coerce
    .number({ message: "Number of students must be a number" })
    .int("Number of students must be a whole number")
    .min(1, "Number of students must be at least 1")
    .max(1000000, "Number of students is too large"),
  message: z.string().trim().max(2000, "Message must be under 2000 characters").optional().default(""),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Invalid request body." }, 400);
  }

  const parsed = demoRequestSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Please check the form and try again.";
    return json({ success: false, error: message }, 400);
  }

  try {
    const demoRequest = await db.demoRequest.create({
      data: {
        schoolName: parsed.data.schoolName,
        contactPerson: parsed.data.contactPerson,
        phone: parsed.data.phone,
        email: parsed.data.email.toLowerCase(),
        numStudents: parsed.data.numStudents,
        message: parsed.data.message,
        status: "PENDING",
      },
    });

    return json({ success: true, id: demoRequest.id }, 201);
  } catch (error) {
    console.error("Failed to store demo request:", error);
    return json({ success: false, error: "Something went wrong. Please try again." }, 500);
  }
}

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
