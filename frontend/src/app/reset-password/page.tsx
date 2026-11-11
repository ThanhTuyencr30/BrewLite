import { ResetPasswordForm } from "@/components/auth/reset-password-form";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string | string[] }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const search = await searchParams;
  const token = typeof search.token === "string" ? search.token : "";

  if (!token) {
    return <ResetPasswordForm token="" />;
  }

  return <ResetPasswordForm token={token} />;
}
