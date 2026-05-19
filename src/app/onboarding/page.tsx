import { OnboardingForm } from "@/app/onboarding/onboarding-form";
import { createDataSupabaseClient } from "@/lib/supabase/data";

async function getInterests() {
  const admin = createDataSupabaseClient();
  const { data } = await admin.from("interests").select("name").order("name");
  return (data ?? []).map((interest) => interest.name);
}

export default async function OnboardingPage() {
  const interests = await getInterests();
  return <OnboardingForm interests={interests} />;
}
