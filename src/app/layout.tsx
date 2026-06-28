import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Poppins } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Axiploy — AI Employees That Get Work Done",
  description:
    "Axiploy helps businesses deploy intelligent AI employees that reduce administration, improve efficiency and scale operations. Book a free discovery call today.",
  keywords: ["AI employees", "digital workforce", "AI implementation", "business automation", "AI onboarding"],
  openGraph: {
    title: "Axiploy — AI Employees That Get Work Done",
    description:
      "Deploy AI employees that work alongside your team. Axiploy delivers practical AI solutions with measurable business outcomes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${poppins.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
