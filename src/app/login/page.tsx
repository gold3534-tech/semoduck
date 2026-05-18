import { Suspense } from "react";
import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <div className="py-8">
      <Suspense fallback={<div className="mx-auto h-96 max-w-md animate-pulse rounded-lg bg-white" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
