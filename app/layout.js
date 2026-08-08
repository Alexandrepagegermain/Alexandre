import "./globals.css";
import Nav from "../components/Nav";

export const metadata = {
  title: "Make Your Friends",
  description: "Rejoignez des associations et rencontrez de nouveaux amis près de chez vous.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        <Nav />
        <main className="max-w-4xl mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}
