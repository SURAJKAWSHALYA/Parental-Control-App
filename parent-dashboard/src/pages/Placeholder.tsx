import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Placeholder = ({ title }: { title: string }) => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 h-full w-full flex flex-col items-center justify-center p-8 bg-neutral-900/30 rounded-xl border border-neutral-800">
      <div className="bg-neutral-800/50 p-6 rounded-full mb-6 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
        <AlertCircle size={48} />
      </div>
      <h2 className="text-3xl font-bold text-white mb-3 text-center">{title}</h2>
      <p className="text-neutral-400 text-center max-w-md mb-8">
        This feature is part of our extended capabilities and is scheduled for a 
        <span className="text-blue-400 font-medium ml-1">future update</span>.
      </p>
      
      <button 
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors font-medium border border-neutral-700 hover:border-neutral-600"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>
    </div>
  );
};

export default Placeholder;
