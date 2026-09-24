import { BlockButton } from "@/components/block-button";
import { ProfileForm } from "@/components/profile-form";
import { getMyBlocks, requireUser } from "@/lib/auth";

export default async function MePage() {
  const [user, blocks] = await Promise.all([requireUser(), getMyBlocks()]);
  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-8">
      <h1 className="font-display text-2xl font-black text-foreground">プロフィール</h1>
      <ProfileForm user={user} />

      <section className="card space-y-3">
        <h2 className="font-display font-extrabold text-foreground">ブロック中のユーザー</h2>
        {blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">ブロックしているユーザーはいません。</p>
        ) : (
          <ul className="divide-y divide-card-border">
            {blocks.map((b) => (
              <li key={b.id} className="py-2">
                <BlockButton userId={b.id} displayName={b.displayName} blocked />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
