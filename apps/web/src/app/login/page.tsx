import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { SocialLogin } from "@/components/social-login";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage(props: PageProps<"/login">) {
  if (await getCurrentUser()) redirect("/");
  const { reset, error } = await props.searchParams;
  return (
    <div className="space-y-4 px-4 py-8">
      {/* パスワード再設定の完了後は /login?reset=1 に来る */}
      {reset === "1" && (
        <p
          role="status"
          className="mx-auto max-w-md rounded-xl border border-success bg-success-bg px-3 py-2 text-sm text-success-foreground"
        >
          パスワードを再設定しました。新しいパスワードでログインしてください。
        </p>
      )}
      <SocialLogin error={typeof error === "string" ? error : undefined} />
      <AuthForm mode="login" />
    </div>
  );
}
