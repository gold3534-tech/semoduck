import { OnboardingForm } from "@/app/onboarding/onboarding-form";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

async function getInterests() {
  const admin = createAdminSupabaseClient();
  const { data } = await admin.from("interests").select("name").order("name");
  return (data ?? []).map((interest) => interest.name);
}

export default async function OnboardingPage() {
  const interests = await getInterests();
  return <OnboardingForm interests={interests} />;
}
