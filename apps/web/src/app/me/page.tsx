import { ProfileForm } from "@/components/profile-form";
import { requireUser } from "@/lib/auth";

export default async function MePage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-bold">プロフィール</h1>
      <ProfileForm user={user} />
    </div>
  );
}
