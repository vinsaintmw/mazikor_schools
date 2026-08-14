import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CancelButton({ href }: { href: string }) {
  return (
    <Button asChild variant="outline" type="button">
      <Link href={href}>Cancel</Link>
    </Button>
  );
}
