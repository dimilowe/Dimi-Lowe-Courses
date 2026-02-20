import { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Store | VCM Suite",
  description: "Apps, downloads, templates, and creator resources from VCM Suite.",
};

export default async function WorkstationsPage() {
  redirect("/store");
}
