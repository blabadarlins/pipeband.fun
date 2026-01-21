import Header from "@/components/Header";

const faqs = [
  {
    question: "How does it work?",
    answer: "You'll be given 10 questions per round. Each question features a 30-second audio clip from a well-known pipe band medley. Your job is to identify the correct tune before time runs out! The faster you answer, the higher your score."
  },
  {
    question: "How do I sign up?",
    answer: "You can sign up using your Spotify account, which makes it quick and easy to start playing."
  },
  {
    question: "Do I need a Spotify subscription to play?",
    answer: "Nope! You just need a free Spotify account to sign in."
  },
  {
    question: "What kind of tunes will I hear?",
    answer: "The quiz includes tunes from legendary pipe band medleys between the 1980s and 2010s—the golden era of competitive pipe band music. Expect everything from classic jigs and strathspeys to blistering reels and hornpipes."
  },
  {
    question: "How is my score calculated?",
    answer: "Correct answers earn you points. Faster responses get you bonus points. Score over 50% correct, and you'll get a special congratulations message!"
  },
  {
    question: "Can I play more than once?",
    answer: "Absolutely! Play as many times as you like and try to beat your best score."
  },
  {
    question: "Can I challenge my friends?",
    answer: "Yes! Share your score and see if your friends can match your pipe band medley expertise."
  },
  {
    question: "What happens if I don't know the tune?",
    answer: "No worries—just take your best guess! Even if you don't score high, you'll still get to enjoy some of the best medley moments in pipe band history."
  },
  {
    question: "How do I prove I'm the ultimate pipeband.fun Trivia champion?",
    answer: "Score high, play often, and show off your results! If you consistently ace the quiz, you've got bragging rights as a true pipe band medley expert."
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-accent">
      <Header logoVariant="light" />
      
      <main className="flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Intro Section */}
          <section className="text-center mb-16 relative">
            <p className="text-white text-xl leading-relaxed max-w-2xl mx-auto">
              <strong>Introducing pipeband.fun</strong> — a fast-paced quiz that puts your medley knowledge to the test. 
              Spanning iconic sets from the 1980s to the 2010s, this 10-question challenge gives you 30 seconds per clip to guess the tune.
            </p>
            <p className="text-white text-xl leading-relaxed max-w-2xl mx-auto mt-6">
              Sign up with your Spotify account and see how many you can nail. It&apos;s time to prove your expertise 
              and relive the golden years of pipe band medleys. Think you&apos;ve got what it takes? Let&apos;s find out!
            </p>
            
            {/* Decorative line */}
            <div className="w-px h-48 bg-white/30 mx-auto mt-12"></div>
            
            {/* Bagpiper mascot placeholder - you'll need to add the actual image */}
            <div className="absolute right-0 bottom-0 w-64 h-80 hidden lg:block">
              {/* Add bagpiper image here when available */}
            </div>
          </section>

          {/* FAQ Section */}
          <section className="pb-16">
            <h2 className="text-white font-black text-4xl mb-8">FAQ</h2>
            
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index}>
                  <h3 className="text-white font-bold text-lg mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-white/90 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Footer logo */}
          <div className="text-center pb-8">
            <span className="logo-fun text-5xl text-white">.fun</span>
          </div>
        </div>
      </main>
    </div>
  );
}
