import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarTravel — Find cheap flights to great driving roads",
  description:
    "Discover destinations with amazing roads and find affordable manual cars on Turo.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen antialiased">{children}</body>
    </html>
  );
}
