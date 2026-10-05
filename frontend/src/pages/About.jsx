import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function About() {
  const [formData, setFormData] = useState({ name: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate sending email via mailto
    const mailtoLink = `mailto:code4youbuddy@gmail.com?subject=Contact from ${formData.name}&body=${encodeURIComponent(formData.message)}`;
    window.location.href = mailtoLink;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-6 py-32 space-y-24"
    >
      {/* Intro Section */}
      <section className="max-w-4xl space-y-6">
          <h1 className="text-5xl font-bold tracking-tight">
            Hi, I'm <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-blue-400">Jaspreet Bhatia</span>
          </h1>
          <p className="text-xl text-on-surface-variant leading-relaxed">
            I am a Full-Stack AI Developer and Cloud Engineer specializing in artificial intelligence, modern web architectures, and scalable cloud solutions under my studio brand, <strong>JBSI</strong>.
          </p>
          <div className="flex gap-4 pt-4">
            <a 
              href="https://github.com/Jaspreet-Bhatia-SI" 
              target="_blank" rel="noreferrer"
              className="bg-black/10 dark:bg-surface-container-lowest/10 hover:bg-black/20 dark:bg-surface-container-lowest/20 text-on-surface dark:text-white px-6 py-3 rounded-full font-medium transition-colors border border-white/5"
            >
              GitHub Profile
            </a>
            <a 
              href="https://linkedin.com/in/jaspreet-bhatia-si" 
              target="_blank" rel="noreferrer"
              className="bg-google-purple/20 hover:bg-google-purple/30 text-google-purple border border-google-purple/30 px-6 py-3 rounded-full font-medium transition-colors"
            >
              Connect on LinkedIn
            </a>
          </div>
      </section>

      {/* Project Info & Contact */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold">Engineering Curator by JBSI</h2>
          <p className="text-on-surface-variant leading-relaxed">
            Curator is an autonomous media platform built to eliminate internet noise. Under the hood, it utilizes <strong>Retrieval-Augmented Generation (RAG)</strong> by performing real-time internet searches to bypass AI knowledge cutoffs. The robust backend integrates localized Node.js environments and <strong>FFmpeg</strong> processing to bypass complex JavaScript anti-bot algorithms, ensuring seamless media extraction.
          </p>
          <ul className="space-y-4 text-on-surface-variant">
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-google-purple"></span> <strong>Frontend:</strong> React, Tailwind CSS & Framer Motion 3D
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-primary"></span> <strong>Backend:</strong> Python FastAPI, yt-dlp, and FFmpeg
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> <strong>AI Engine:</strong> Groq LLMs augmented with DuckDuckGo RAG
            </li>
          </ul>
        </div>

        <div className="bg-google-surface/60 backdrop-blur-xl border border-outline/20 dark:border-white/10 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-semibold mb-6">Get in touch</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Your Name</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-black/50 border border-outline/20 dark:border-white/10 rounded-xl px-4 py-3 text-on-surface dark:text-white focus:outline-none focus:border-google-purple transition-colors"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Message</label>
              <textarea 
                required
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="w-full bg-black/50 border border-outline/20 dark:border-white/10 rounded-xl px-4 py-3 text-on-surface dark:text-white focus:outline-none focus:border-google-purple transition-colors h-32 resize-none"
                placeholder="Let's build something amazing..."
              ></textarea>
            </div>
            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-secondary to-blue-600 hover:from-secondary/80 hover:to-blue-600/80 text-on-surface dark:text-white font-medium py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(187,170,255,0.3)]"
            >
              Send Message
            </button>
            <p className="text-center text-xs text-outline mt-4">
              Directly connects to code4youbuddy@gmail.com
            </p>
          </form>
        </div>
      </section>
    </motion.div>
  );
}
