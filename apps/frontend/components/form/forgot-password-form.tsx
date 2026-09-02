import AuthCard from '@/components/auth/authCard';
import { useResetPassword } from '@/hooks/auth/use-reset-password';

export default function ForgotPasswordForm() {
  const {
    email,
    code,
    loading,
    error,

    setCode,
    setEmail,

    handleSendCode,
    handleVerifyCode,
  } = useResetPassword();

  return (
    <AuthCard type="Forgot Password">
      <form method="post" onSubmit={handleSendCode}></form>
    </AuthCard>
  );
}
