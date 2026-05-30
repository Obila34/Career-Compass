import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase/client';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function Auth() {
  const navigate = useNavigate();

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen relative bg-[#05070a] text-slate-100 flex flex-col justify-center items-center p-6 overflow-hidden">
      {/* Mesh Gradient Background Overlays */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-orange-900/30 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 relative z-10">
        <h1 className="text-2xl font-bold mb-2 text-center text-white">Welcome to Introd Career Compass</h1>
        <p className="text-slate-400 text-center text-sm mb-8">The trust-first career mobility platform for the African diaspora.</p>
        
        <button 
          onClick={handleSignIn}
          className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors"
        >
          Sign In with Google
        </button>
      </div>
    </div>
  );
}
