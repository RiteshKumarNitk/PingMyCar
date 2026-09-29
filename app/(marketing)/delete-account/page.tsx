import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Delete your OwnerPing account",
  description: "How to delete your OwnerPing account and what happens to your data.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border py-8 last:border-b-0">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

export default function DeleteAccountPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <p className="eyebrow">Account</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Delete your OwnerPing account</h1>

      <div className="mt-6">
        <Section title="How to delete it">
          <p>
            <strong className="text-foreground">In the OwnerPing app:</strong> Profile → Account →
            Delete account, then confirm.
          </p>
          <p>
            <strong className="text-foreground">On the web:</strong>{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              sign in with Google
            </Link>
            , open Dashboard → Settings → Delete account, then confirm.
          </p>
          <p>
            Can&apos;t sign in? Email{" "}
            <a href="mailto:info@innovatex-technology.com" className="font-medium text-primary underline-offset-4 hover:underline">
              info@innovatex-technology.com
            </a>{" "}
            from the Google account email you use with OwnerPing and ask us to delete it.
          </p>
        </Section>

        <Section title="What is deleted">
          <p>
            Deletion is immediate and permanent: your account and its Google sign-in link;
            your name, email address and photo; all of your vehicles and their QR codes
            (printed stickers stop working); vehicle photos; conversations and messages; and
            the notification tokens of your devices. Signing in with the same Google account
            later creates a new, empty account.
          </p>
        </Section>

        <Section title="What may be kept, and for how long">
          <p>
            If a conversation on your vehicle is under an open abuse report, that conversation
            and its messages are kept until our moderators finish the review. The account is
            then kept only as an anonymized, disabled record (no name, email, photo or vehicle
            details), and the vehicle&apos;s QR is turned off.
          </p>
          <p>A security log records that the deletion happened, without your personal details.</p>
        </Section>
      </div>
    </section>
  );
}
