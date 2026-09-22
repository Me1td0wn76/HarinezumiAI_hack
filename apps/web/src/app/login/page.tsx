import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <div className="px-4 py-8">
      <AuthForm mode="login" />
    </div>
  );
}
