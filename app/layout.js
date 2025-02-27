import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
    title: "Diverse Diaries",
    description: "A place to read, write, and deepen your understanding.",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
        <body className="bg-white text-gray-900">
        <AuthProvider>
            <Header />
            <main>{children}</main>
            <Footer />
        </AuthProvider>
        </body>
        </html>
    );
}
