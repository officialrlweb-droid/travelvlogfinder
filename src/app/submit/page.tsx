import type { Metadata } from "next";
import { SubmitCreatorForm } from "@/components/SubmitCreatorForm";

export const metadata: Metadata = {
  title: "Submit a Creator Page — TravelVlogFinder",
  description:
    "Submit your Kerala YouTube or Instagram travel vlog page to be listed on TravelVlogFinder.",
};

export default function SubmitPage() {
  return <SubmitCreatorForm />;
}
