import { type FC, useState } from 'react';
import { Download, Trash2, AlertTriangle, CheckCircle2, Loader2, Clock } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { cn } from '../../utils/helpers';

const DataStorageSection: FC = () => {
  const { queries, mutations } = useSettings();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const handleDownloadRequest = () => {
    mutations.requestDataExport.mutate();
  };

  const exportStatus = queries.exportStatus.data;

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-text-base">Data & Storage</h2>
        <p className="text-[14px] text-text-muted font-bold">Manage your personal data and account status</p>
      </div>

      {/* GDPR Data Download */}
      <div className="bg-bg-card rounded-[32px] border border-border-base/50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] p-8 space-y-8">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
            <Download className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="text-[16px] font-black text-text-base">Download Your Information</h4>
            <p className="text-[13px] text-text-muted font-bold mt-0.5">Get a copy of your photos, posts, and profile details</p>
          </div>
          
          <button 
            onClick={handleDownloadRequest}
            disabled={mutations.requestDataExport.isPending || exportStatus?.status === 'pending' || exportStatus?.status === 'processing'}
            className="px-6 py-2.5 bg-blue-500 text-white text-[12px] font-black uppercase rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50"
          >
            {mutations.requestDataExport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request Download"}
          </button>
        </div>

        {exportStatus && (
          <div className={cn(
            "p-5 rounded-3xl border flex items-center gap-4",
            exportStatus.status === 'completed' ? "bg-green-500/10 border-green-500/20 text-green-600" :
            exportStatus.status === 'failed' ? "bg-red-500/10 border-red-500/20 text-red-600" :
            "bg-blue-500/10 border-blue-500/20 text-blue-600"
          )}>
            {exportStatus.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> :
             exportStatus.status === 'failed' ? <AlertTriangle className="w-5 h-5" /> :
             <Clock className="w-5 h-5 animate-pulse" />}
            
            <div className="flex-1">
              <p className="text-[13px] font-bold">
                {exportStatus.status === 'completed' ? "Your data is ready for download" :
                 exportStatus.status === 'failed' ? "Export failed. Please try again." :
                 "Processing your data... this may take a few minutes."}
              </p>
              {exportStatus.status === 'completed' && (
                <a 
                  href={exportStatus.file_path} 
                  download 
                  className="text-[12px] font-black underline mt-1 inline-block"
                >
                  Click here to download ZIP
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Account Deletion */}
      <div className="bg-red-500/5 rounded-[32px] border border-red-500/20 p-8 space-y-8">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-600">
            <Trash2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="text-[16px] font-black text-red-600">Delete Account</h4>
            <p className="text-[13px] text-red-600/70 font-bold mt-0.5">This will deactivate your account for 30 days, then permanently delete all data.</p>
          </div>
          
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-2.5 bg-red-600 text-white text-[12px] font-black uppercase rounded-xl hover:bg-red-700 transition-all shadow-md shadow-red-200"
          >
            Delete Account
          </button>
        </div>

        {showDeleteConfirm && (
          <div className="p-8 bg-bg-card rounded-3xl border border-red-500/20 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h5 className="font-black text-[16px]">Final Confirmation Required</h5>
            </div>
            <p className="text-text-muted text-[13px] font-bold mb-6 leading-relaxed">
              To confirm deletion, please type <span className="text-red-600 font-black">DELETE MY ACCOUNT</span> below. 
              Remember, this action is irreversible after 30 days.
            </p>
            
            <input 
              type="text"
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              className="w-full bg-red-500/5 border border-red-500/10 rounded-2xl px-5 py-4 text-sm font-black text-red-600 placeholder:text-red-500/30 outline-none focus:border-red-500 mb-6"
              placeholder="Type confirmation here..."
            />

            <div className="flex gap-4">
              <button 
                onClick={() => mutations.deleteAccount.mutate()}
                disabled={deleteInput !== 'DELETE MY ACCOUNT' || mutations.deleteAccount.isPending}
                className="flex-1 py-4 bg-red-600 text-white text-[12px] font-black uppercase rounded-2xl hover:bg-red-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {mutations.deleteAccount.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Confirm Permanent Deletion"}
              </button>
              <button 
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                className="px-8 py-4 bg-bg-base text-text-base text-[12px] font-black uppercase rounded-2xl hover:bg-bg-card transition-all border border-border-base/50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataStorageSection;
