import { motion } from 'framer-motion';

export default function Loader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center h-full w-full py-8"
    >
      <div className="flex items-center space-x-2 text-lg font-medium text-gray-700">
        <span>Estimation en cours</span>
        <AnimatedDots />
      </div>
      <div className="mt-2 text-sm text-gray-400">Cela prend généralement 5 à 10 secondes.</div>
    </motion.div>
  );
}

function AnimatedDots() {
  return (
    <span className="inline-flex">
      <motion.span
        className="dot"
        style={{ display: 'inline-block' }}
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut', delay: 0 }}
      >
        .
      </motion.span>
      <motion.span
        className="dot"
        style={{ display: 'inline-block' }}
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut', delay: 0.3 }}
      >
        .
      </motion.span>
      <motion.span
        className="dot"
        style={{ display: 'inline-block' }}
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut', delay: 0.6 }}
      >
        .
      </motion.span>
    </span>
  );
} 