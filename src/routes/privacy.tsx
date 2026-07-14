import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () =>
    seoHead({
      title: "Privacy Policy | namflirt.",
      description:
        "Learn how namflirt. uses and protects profile, matching and account information for members dating across Namibia.",
      path: "/privacy",
    }),
  component: Privacy,
});

function Privacy() {
  return (
    <PolicyPage
      eyebrow="Privacy"
      title="Privacy policy"
      intro="This policy describes the information namflirt. uses to run the service, personalize matching, protect members, and improve the app."
      sections={[
        {
          title: "Information you provide",
          body: "We use the details you add to your account and profile to help people understand who you are and what kind of connection you want.",
          items: [
            "Profile details such as name, age range, location, languages, interests, photos, and relationship goals.",
            "Account details used for sign-in, authentication, subscription access, and support.",
            "Messages, likes, matches, reports, and settings created while using the service.",
          ],
        },
        {
          title: "How information is used",
          body: "Your data helps power matching, discovery, messaging, safety checks, account management, and product improvements.",
          items: [
            "Show your profile to relevant members based on your settings and plan.",
            "Prevent spam, abuse, fake accounts, and policy violations.",
            "Understand which features work well and where the experience needs improvement.",
          ],
        },
        {
          title: "Your control",
          body: "You can update your profile and account settings in the app. Some information may need to be retained where required for safety, fraud prevention, legal, or operational reasons.",
          items: [
            "Choose what to share on your public profile.",
            "Use block and report controls when needed.",
            "Request account or data support through the app when support tools are available.",
          ],
        },
        {
          title: "Security",
          body: "We use reasonable technical and operational safeguards, but no online service can guarantee perfect security. Keep your login details private and report suspicious activity.",
        },
      ]}
    />
  );
}
