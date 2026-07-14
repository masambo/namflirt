import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () =>
    seoHead({
      title: "Terms of Use | namflirt.",
      description:
        "Read the terms for using namflirt., including honest profiles, respectful dating, member safety and plan access across Namibia.",
      path: "/terms",
    }),
  component: Terms,
});

function Terms() {
  return (
    <PolicyPage
      eyebrow="Terms"
      title="Terms of use"
      intro="These terms explain the basic expectations for using namflirt. They are written plainly so members know what is allowed, what is not, and how we keep the service fair."
      sections={[
        {
          title: "Use namflirt. honestly",
          body: "Your profile should represent you truthfully. Do not impersonate someone else, use misleading photos, or create accounts for spam, scams, harassment, or commercial solicitation.",
          items: [
            "You are responsible for the activity on your account.",
            "Profile information, photos, messages, and preferences should be accurate and respectful.",
            "Do not attempt to bypass safety systems, limits, subscriptions, or account restrictions.",
          ],
        },
        {
          title: "Respect other members",
          body: "namflirt. is for mutual, respectful connection. Members must follow the community guidelines and should stop contacting someone when interest is not mutual.",
          items: [
            "Consent matters in messages, photos, meeting plans, and continued contact.",
            "Harassment, hate speech, threats, sexual coercion, and abuse are not allowed.",
            "Report behavior that feels unsafe or violates these terms.",
          ],
        },
        {
          title: "Plans and access",
          body: "Free and paid plans may include different message, like, profile view, and discovery limits. Paid access can change over time as features are improved.",
          items: [
            "Plan features are shown before upgrade and inside the app.",
            "We may limit, suspend, or remove accounts that misuse the service.",
            "Some features may require identity, payment, or safety checks before access is granted.",
          ],
        },
        {
          title: "Changes and contact",
          body: "We may update these terms as namflirt. grows. Continued use of the service after changes means you accept the updated terms.",
        },
      ]}
    />
  );
}
