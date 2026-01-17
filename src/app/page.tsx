import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import SpotifyIcon from "@/components/SpotifyIcon";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="heading-xl mb-8">
            Your modern<br />pipe band trivia.
          </h1>
          
          <p className="text-body max-w-xl mx-auto mb-4">
            A fast-paced quiz that puts your pipe band knowledge to the test. 
            It&apos;s time to relive the golden years of pipe band medleys.
          </p>
          
          <p className="text-body max-w-xl mx-auto mb-10">
            Think you&apos;ve got what it takes? Let&apos;s find out!
          </p>
          
          <Link href="/api/auth/spotify">
            <Button variant="primary" icon={<SpotifyIcon />}>
              Play free
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
