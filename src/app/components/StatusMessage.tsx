import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface StatusMessageProps {
  type: 'success' | 'error' | 'info';
  message: string;
  timeout?: number;
  onClose?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

export default function StatusMessage({ type, message, timeout, onClose, actionLabel, onAction }: StatusMessageProps) {
  useEffect(() => {
    if (timeout && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, timeout);
      return () => clearTimeout(timer);
    }
  }, [timeout, onClose]);

  let bg = '', text = '', Icon = Info;
  if (type === 'success') {
    bg = 'bg-green-100';
    text = 'text-green-800';
    Icon = CheckCircle;
  } else if (type === 'error') {
    bg = 'bg-red-100';
    text = 'text-red-800';
    Icon = AlertTriangle;
  } else if (type === 'info') {
    bg = 'bg-blue-100';
    text = 'text-blue-800';
    Icon = Info;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
        className={`flex items-center gap-3 rounded-md p-4 mb-4 shadow-sm ${bg}`}
      >
        <Icon className={`w-5 h-5 ${text}`} />
        <span className={`flex-1 ${text} text-sm font-medium`}>{message}</span>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className={`ml-2 ${text} underline text-xs font-semibold hover:text-opacity-80`}
          >
            {actionLabel}
          </button>
        )}
        {!timeout && onClose && (
          <button onClick={onClose} className={`ml-2 ${text} hover:underline text-xs`}>Fermer</button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Exemple d'utilisation (à supprimer ou commenter en prod)
/*
import { useState } from 'react';
function Demo() {
  const [show, setShow] = useState(true);
  return (
    <div>
      {show && (
        <StatusMessage
          type="error"
          message="Une erreur de test est survenue."
          onClose={() => setShow(false)}
        />
      )}
      <button onClick={() => setShow(true)}>Afficher l'erreur</button>
    </div>
  );
}
*/ 