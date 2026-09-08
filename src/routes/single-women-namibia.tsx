import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/single-women-namibia")({
  head: () =>
    seoHead({
      title: "Single Women in Namibia | Meet Namibian Singles | namflirt.",
      description:
        "Meet single women in Namibia on namflirt. Discover Namibian singles by town, language, culture, interests, and relationship goals.",
      path: "/single-women-namibia",
    }),
  component: SingleWomenNamibia,
});

function SingleWomenNamibia() {
  return (
    <PolicyPage
      eyebrow="Single women in Namibia"
      title="Meet single women in Namibia"
      intro="namflirt. helps respectful members discover single women in Namibia through thoughtful profiles, shared interests, local context, and clear relationship goals."
      sections={[
        {
          title: "Profiles with real context",
          body: "Members can share more than a photo. Profiles include town, region, languages, interests, lifestyle, faith, culture, and what each person is looking for.",
          items: [
            "Find compatible Namibian singles through shared values and interests.",
            "Use profile details to start better conversations.",
            "Respectful messaging and reporting tools help protect the community.",
          ],
        },
        {
          title: "Dating across Namibia",
          body: "From Windhoek to the coast, the north, the south, and the east, namflirt. is made for people who want a local dating experience that understands Namibia.",
        },
        {
          title: "Start with intention",
          body: "Single women and single men can join, complete a profile, and use Premium for 30 days.",
        },
      ]}
    />
  );
}
