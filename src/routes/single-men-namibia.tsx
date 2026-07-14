import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/single-men-namibia")({
  head: () =>
    seoHead({
      title: "Single Men in Namibia | Meet Namibian Singles | namflirt.",
      description:
        "Meet single men in Namibia on namflirt. Discover Namibian singles by town, language, culture, interests, and relationship goals.",
      path: "/single-men-namibia",
    }),
  component: SingleMenNamibia,
});

function SingleMenNamibia() {
  return (
    <PolicyPage
      eyebrow="Single men in Namibia"
      title="Meet single men in Namibia"
      intro="namflirt. gives single men in Namibia and the people who want to meet them a calmer, more local way to connect through honest profiles and shared intentions."
      sections={[
        {
          title: "More than a swipe",
          body: "Profiles are designed to show personality, location, language, interests, lifestyle, and relationship goals so members can decide with more care.",
          items: [
            "Meet Namibian singles looking for meaningful conversation.",
            "Discover people across regions and towns in Namibia.",
            "Use likes, matches, messages, and profile details to move at a respectful pace.",
          ],
        },
        {
          title: "A local dating site for Namibia",
          body: "namflirt. is built around Namibian people and Namibian context, not a one-size-fits-all dating experience copied from somewhere else.",
        },
        {
          title: "Clear access while payments are pending",
          body: "Every new signup receives a 14-day Premium trial while VIP upgrades and payment gateway setup are paused.",
        },
      ]}
    />
  );
}
