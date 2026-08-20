import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const h=await headers(), host=h.get("x-forwarded-host")||h.get("host")||"localhost:3000", protocol=h.get("x-forwarded-proto")||"http", base=new URL(`${protocol}://${host}`);
  const title="LicenceFlow — Lisans ve Abonelik Takibi", description="Şirketinizin yazılım lisanslarını, yenilemelerini ve maliyetlerini tek yerden yönetin.";
  return { metadataBase:base,title,description,icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"},openGraph:{title,description,images:[{url:"/og.png",width:1536,height:1024,alt:"LicenceFlow lisans takip dashboard'u"}]},twitter:{card:"summary_large_image",title,description,images:["/og.png"]} };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
