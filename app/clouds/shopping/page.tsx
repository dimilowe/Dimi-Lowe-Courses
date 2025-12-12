import { Metadata } from "next";
import ShoppingCloudClient from "./ShoppingCloudClient";

export const metadata: Metadata = {
  title: "Shopping Cloud - Universal Cart & Collections | VCM Suite",
  description: "Save items from any store, organize into collections, track prices, and manage your universal shopping cart.",
};

export default function ShoppingCloudPage() {
  return <ShoppingCloudClient />;
}
