import { useState } from "react";
import Navbar from "../../components/Navbar";

const Home = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const onSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail("");
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-900 to-violet-900 text-white">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-6 w-[70vw] m-auto mt-8">
        <div className="max-w-3xl w-full text-center">
          {/* Badge */}
          <div className="inline-block mb-6 px-4 py-1 rounded-full bg-white/10 text-sm text-white/80 backdrop-blur">
            🚀 Launching Soon
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            A Better Way to Chat
          </h1>

          {/* Description */}
          <p className="text-lg text-white/75 max-w-2xl mx-auto mb-10">
            Convo is coming with secure real-time chat, audio & video calls, and
            smooth group conversations — built for speed and simplicity.
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            {[
              "End-to-end encryption",
              "Audio & video calls",
              "Fast & responsive UI",
            ].map((item) => (
              <div
                key={item}
                className="rounded-xl bg-white/5 border border-white/10 p-4 text-white/80"
              >
                {item}
              </div>
            ))}
          </div>


        </div>
      </main>

      <footer className="py-6 text-center text-white/50 text-sm border-t border-white/5">
        © {new Date().getFullYear()} Codex-Conquer · MERN & WebRTC
      </footer>
    </div>
  );
};

export default Home;
