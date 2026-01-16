import React from 'react';
import { motion } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import { Brain, Heart, Users, Shield } from 'lucide-react';

const AboutPage: React.FC = () => {
  const calc = (x: number, y: number) => {
    const bounds = document.getElementById('card')?.getBoundingClientRect();
    if (!bounds) return [0, 0, 1];
    return [
      -(y - bounds.top - bounds.height / 2) / 20,
      (x - bounds.left - bounds.width / 2) / 20,
      1.1
    ];
  };
  
  const trans = (x: number, y: number, s: number) => 
    `perspective(600px) rotateX(${x}deg) rotateY(${y}deg) scale(${s})`;

  const [props, set] = useSpring(() => ({
    xys: [0, 0, 1],
    config: { mass: 5, tension: 350, friction: 40 }
  }));

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4">
      <motion.div
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-16">
          <motion.h1
            className="text-5xl font-semibold mb-6 text-[#6E2B8A]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            About Mindful Journal
          </motion.h1>
          <motion.p
            className="text-xl text-black dark:text-white max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Empowering mental wellness through AI-driven support and self-reflection
          </motion.p>
        </div>

        <animated.div
          id="card"
          className="bg-white dark:bg-[#16213e] rounded-2xl shadow-md border-2 border-[#f4e4f5] dark:border-[#6E2B8A] p-8 mb-16"
          onMouseMove={({ clientX, clientY }) => set({ xys: calc(clientX, clientY) })}
          onMouseLeave={() => set({ xys: [0, 0, 1] })}
          style={{
            transform: props.xys.to(trans)
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-[#6E2B8A]">Our Mission</h2>
              <p className="text-black dark:text-white mb-6">
                At Mindful Journal, we believe that mental wellness should be accessible to everyone. 
                Our AI-powered platform provides a safe space for self-reflection, emotional 
                support, and personal growth.
              </p>
              <p className="text-black dark:text-white">
                While we're not a replacement for professional mental health services, 
                we aim to be a supportive companion on your journey to better mental well-being.
              </p>
            </div>
            <div className="flex items-center justify-center">
              <motion.div
                className="relative w-48 h-48"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain size={64} className="text-[#6E2B8A] dark:text-[#a323af]" />
                </div>
                <div className="absolute w-full h-full border-4 border-[#6E2B8A] dark:border-[#a323af] rounded-full" />
              </motion.div>
            </div>
          </div>
        </animated.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: <Heart size={32} />,
              title: "Empathetic Support",
              description: "Our AI is designed to provide understanding and compassionate responses."
            },
            {
              icon: <Shield size={32} />,
              title: "Privacy First",
              description: "Your data is stored locally and never shared with third parties."
            },
            {
              icon: <Users size={32} />,
              title: "Community Driven",
              description: "Built with input from mental health professionals and users."
            }
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              className="bg-white dark:bg-[#16213e] p-6 rounded-xl shadow-md border-2 border-[#f4e4f5] dark:border-[#6E2B8A]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="h-12 w-12 bg-[#f4e4f5] dark:bg-[#2d1b4e] rounded-lg flex items-center justify-center mb-4 text-[#6E2B8A] dark:text-[#a323af]">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#6E2B8A]">{feature.title}</h3>
              <p className="text-black dark:text-white">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AboutPage;