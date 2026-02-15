import React from 'react';
import { FileSpreadsheet, Package, Upload, Loader2, Plus } from 'lucide-react';
import Button from '../ui/Button';

const BulkImport = ({ bulkFile, handleCSVUpload, processCSV, isUploading, aiProgress, setActiveTab }) => {
    return (
        <div className="max-w-3xl mx-auto bg-gray-950/50 backdrop-blur-2xl p-16 rounded-[4rem] border border-white/10 shadow-2xl text-center animate-fadeIn relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/5 rounded-full -mr-48 -mt-48 blur-[100px]"></div>

            <div className="bg-purple-600/10 w-24 h-24 rounded-[2rem] border border-purple-500/20 flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-purple-500/10">
                <FileSpreadsheet className="text-purple-400" size={48} />
            </div>
            <h3 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">Bulk Import</h3>
            <p className="text-gray-500 font-bold max-w-md mx-auto leading-relaxed mb-12">
                Upload a CSV file to add multiple products at once. AI will enhance product details automatically.
            </p>

            <div className="border-2 border-dashed border-white/5 rounded-[3rem] p-12 hover:border-purple-500/40 transition-all bg-white/5 relative mb-12 group">
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {bulkFile ? (
                    <div className="text-purple-400 font-black flex flex-col items-center gap-4">
                        <div className="p-4 bg-purple-500/10 rounded-2xl">
                            <Package size={40} className="animate-bounce" />
                        </div>
                        <span className="text-xl tracking-tight">{bulkFile.name}</span>
                        <span className="text-[10px] bg-white/5 px-4 py-1 rounded-full text-gray-500">READY FOR UPLOAD</span>
                    </div>
                ) : (
                    <div className="text-gray-700 group-hover:text-gray-500 transition-colors flex flex-col items-center gap-4">
                        <Upload className="opacity-20 group-hover:scale-110 transition-transform" size={48} />
                        <p className="font-black text-xl uppercase tracking-tighter">Drop CSV Here</p>
                        <p className="text-xs uppercase tracking-[0.2em] font-bold">Format: name, price, category, ...</p>
                    </div>
                )}
            </div>

            <Button
                onClick={processCSV}
                disabled={!bulkFile || isUploading}
                className="w-full py-8 text-xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-[0_15px_50px_-10px_rgba(168,85,247,0.4)] relative overflow-hidden font-black uppercase tracking-[0.3em]"
            >
                {isUploading ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-4">
                            <Loader2 className="animate-spin" size={24} />
                            <span className="text-sm">Processing Products... {aiProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden max-w-sm">
                            <div
                                className="h-full bg-white shadow-[0_0_15px_white] transition-all duration-300"
                                style={{ width: `${aiProgress}%` }}
                            ></div>
                        </div>
                    </div>
                ) : (
                    <><Plus className="mr-3" /> Start Import</>
                )}
            </Button>

            <button
                onClick={() => setActiveTab('manage')}
                className="mt-10 text-gray-600 hover:text-purple-400 font-black text-xs uppercase tracking-widest transition-all"
            >
                Cancel
            </button>
        </div>
    );
};

export default BulkImport;
