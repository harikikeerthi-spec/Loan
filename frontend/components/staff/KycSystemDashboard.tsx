
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { documentApi } from '@/lib/api';

interface KycSystemDashboardProps {
  userId: string;
  application: any;
  onRefresh: () => void;
}

const KycSystemDashboard: React.FC<KycSystemDashboardProps> = ({ userId, application, onRefresh }) => {
  const [uploading, setUploading] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; type: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState<'aadhaar' | 'pan' | 'passport'>('aadhaar');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(selectedType);
    setProcessing(true);
    setResult(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview({ url: reader.result as string, type: file.type });
    };
    reader.readAsDataURL(file);

    try {
      const res = await documentApi.upload(userId, selectedType, file) as any;
      if (res.success) {
        setResult(res.data.ocrResult || res.data.verification);
        onRefresh();
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setResult({ error: 'Failed to process document' });
    } finally {
      setUploading(null);
      setProcessing(false);
    }
  };

  const docTypes = [
    { id: 'aadhaar', name: 'Aadhaar Card', icon: 'fingerprint', color: 'indigo' },
    { id: 'pan', name: 'PAN Card', icon: 'badge', color: 'emerald' },
    { id: 'passport', name: 'Passport', icon: 'public', color: 'blue' },
  ];

  const handleAutoFill = async () => {
    if (!result || !result.extracted_data) return;
    
    setProcessing(true);
    try {
      // Map extracted fields to profile fields
      const fieldMapping: Record<string, string> = {
        'full_name': 'firstName', // Simplification, usually needs splitting
        'dob': 'dob',
        'pan_number': 'panNumber',
        'aadhaar_number': 'aadhaarNumber',
        'passport_number': 'passportNumber',
        'father_name': 'fatherName',
      };

      const updates: any = {};
      Object.entries(result.extracted_data).forEach(([key, value]) => {
        const profileField = fieldMapping[key];
        if (profileField) {
          updates[profileField] = value;
        }
      });

      // Special handling for full name split
      if (result.extracted_data.full_name) {
        const parts = String(result.extracted_data.full_name).split(' ');
        updates.firstName = parts[0];
        updates.lastName = parts.slice(1).join(' ') || '.';
      }

      const res = await documentApi.updateProfile(userId, updates) as any;
      if (res.success) {
        alert('Profile successfully updated with extracted data!');
        onRefresh();
      }
    } catch (err) {
      console.error('Auto-fill failed:', err);
      alert('Failed to sync data with profile.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[28px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">ID OCR & KYC System</h2>
          <p className="text-[12px] font-black text-indigo-600 uppercase tracking-widest mt-1">Automatic Extraction & Verification</p>
        </div>
        <div className="flex gap-3">
          {docTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id as any)}
              className={`px-5 py-3 rounded-2xl border transition-all flex items-center gap-2 ${
                selectedType === type.id 
                ? `bg-${type.color}-600 border-${type.color}-600 text-white shadow-lg shadow-${type.color}-200`
                : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{type.icon}</span>
              <span className="text-[12px] font-black uppercase tracking-wider">{type.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Upload & Preview Area */}
        <div className="col-span-7">
          <div 
            className="bg-white/70 backdrop-blur-md rounded-[40px] border border-white/50 shadow-xl overflow-hidden min-h-[500px] flex flex-col relative group cursor-pointer"
            onClick={() => !processing && fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload}
              accept="image/*,application/pdf"
            />
            
            {preview ? (
              <div className="flex-1 relative flex items-center justify-center p-8">
                {preview.type === 'application/pdf' ? (
                  <iframe src={preview.url} className="w-full h-full rounded-2xl" />
                ) : (
                  <img src={preview.url} className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" />
                )}
                
                <AnimatePresence>
                  {processing && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-indigo-900/60 backdrop-blur-md flex flex-col items-center justify-center text-white"
                    >
                      <div className="w-20 h-20 border-4 border-white/20 border-t-white rounded-full animate-spin mb-6" />
                      <h3 className="text-[20px] font-bold">AI Processing...</h3>
                      <p className="text-[12px] font-medium text-white/70 mt-2 tracking-widest uppercase">Extracting structured data</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="absolute top-6 right-6 flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setPreview(null); setResult(null); }}
                    className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-all flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
                <div className="w-24 h-24 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <span className="material-symbols-outlined text-[48px]">cloud_upload</span>
                </div>
                <div>
                  <h3 className="text-[22px] font-bold text-[#0d1b2a]">Upload {selectedType.toUpperCase()} Card</h3>
                  <p className="text-slate-500 max-w-xs mx-auto mt-2">Drag and drop your document here or click to browse files</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span> PDF
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span> JPG/PNG
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Extraction Results Area */}
        <div className="col-span-5 space-y-6">
          <div className="bg-[#0d1b2a] rounded-[40px] p-8 shadow-2xl min-h-[500px] text-white flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[20px] font-bold tracking-tight">Extraction Data</h3>
              {result && (
                <div className="flex gap-2">
                  {result.fraud_detected && (
                    <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500/20 border border-rose-500/40 text-rose-400">
                      Fraud Detected
                    </div>
                  )}
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    result.is_valid && !result.fraud_detected ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  }`}>
                    {result.is_valid ? 'Verified' : 'Validation Error'}
                  </div>
                </div>
              )}
            </div>

            {result ? (
              <div className="flex-1 flex flex-col">
                <div className="space-y-6 flex-1 overflow-y-auto pr-2 max-h-[400px]">
                  {result.extracted_data && Object.entries(result.extracted_data).map(([key, value]: [string, any]) => (
                    <div key={key} className="space-y-1 group">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{key.replace(/_/g, ' ')}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-[16px] font-bold text-white group-hover:text-indigo-400 transition-colors">{String(value)}</p>
                        <span className="material-symbols-outlined text-slate-700 text-[18px]">check_circle</span>
                      </div>
                      <div className="h-px bg-slate-800 w-full mt-2" />
                    </div>
                  ))}
                  
                  {result.missing_fields?.length > 0 && (
                    <div className="mt-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                       <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">Missing Fields</p>
                       <div className="flex flex-wrap gap-2">
                         {result.missing_fields.map((f: string) => (
                           <span key={f} className="px-2 py-1 bg-amber-500/20 text-amber-400 text-[9px] font-bold uppercase rounded-md">{f.replace(/_/g, ' ')}</span>
                         ))}
                       </div>
                    </div>
                  )}

                  {result.fraud_reason && (
                    <div className="mt-8 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                       <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Fraud Indicators</p>
                       <p className="text-[12px] text-rose-300 font-medium">{result.fraud_reason}</p>
                    </div>
                  )}
                  
                  {!result.extracted_data && !result.error && (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                      <span className="material-symbols-outlined text-[48px] text-slate-700">error</span>
                      <p className="text-slate-500 font-medium">Extraction failed for this document.</p>
                    </div>
                  )}

                  {result.error && (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                      <span className="material-symbols-outlined text-[48px] text-rose-500">warning</span>
                      <p className="text-rose-400 font-medium">{result.error}</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-8 border-t border-slate-800 flex gap-4">
                  <button 
                    onClick={handleAutoFill}
                    disabled={processing || !result.is_valid || result.fraud_detected}
                    className="flex-1 py-4 bg-white text-[#0d1b2a] rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
                  >
                    {processing ? 'Syncing...' : 'Auto-Fill Profile'}
                  </button>
                  <button className="w-14 h-14 border border-slate-800 rounded-2xl flex items-center justify-center hover:bg-slate-800 transition-all">
                    <span className="material-symbols-outlined">download</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-700">
                  <span className="material-symbols-outlined text-[32px]">database</span>
                </div>
                <p className="text-slate-500 font-medium">Waiting for document upload...</p>
              </div>
            )}
          </div>

          {/* Verification Status Card */}
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg flex flex-col gap-4"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex flex-col items-center justify-center">
                  <p className="text-[18px] font-black text-indigo-600 leading-none">{result.confidence_score || 0}%</p>
                  <p className="text-[8px] font-black text-indigo-400 uppercase mt-1">Accuracy</p>
                </div>
                <div className="flex-1">
                  <h4 className="text-[14px] font-bold text-slate-900 uppercase tracking-wide">OCR Confidence Score</h4>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${result.confidence_score || 0}%` }}
                      className={`h-full ${(result.confidence_score || 0) > 85 ? 'bg-emerald-500' : (result.confidence_score || 0) > 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    />
                  </div>
                </div>
              </div>
              
              {(result.confidence_score || 0) < 80 && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                  <span className="material-symbols-outlined text-amber-600 text-[20px]">error_outline</span>
                  <div>
                    <p className="text-[12px] font-bold text-amber-800 uppercase tracking-wide">Manual Review Required</p>
                    <p className="text-[11px] text-amber-700 mt-1">AI extraction confidence is below threshold. Please verify all fields manually against the document scan before auto-filling.</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KycSystemDashboard;
