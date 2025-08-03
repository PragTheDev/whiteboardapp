import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/whiteboard.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Collaborative Whiteboard - Draw Together in Real-Time",
  description:
    "A modern collaborative whiteboard application with real-time drawing, shapes, and multi-user support",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
