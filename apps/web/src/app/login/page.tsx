import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { SocialLogin } from "@/components/social-login";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage(props: PageProps<"/login">) {
  if (await getCurrentUser()) redirect("/");
  const { error } = await props.searchParams;
  return (
    <div className="space-y-4 px-4 py-8">
      <SocialLogin error={typeof error === "string" ? error : undefined} />
      <AuthForm mode="login" />
    </div>
  );
}
