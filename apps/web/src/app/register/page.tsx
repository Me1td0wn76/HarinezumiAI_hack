import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { SocialLogin } from "@/components/social-login";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <div className="space-y-4 px-4 py-8">
      <SocialLogin />
      <AuthForm mode="register" />
    </div>
  );
}
