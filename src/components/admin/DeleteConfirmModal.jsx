import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';

const DeleteConfirmModal = ({ itemToDelete, setItemToDelete, deleteProduct }) => {
    if (!itemToDelete) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#030014]/90 backdrop-blur-md animate-fadeIn" onClick={() => setItemToDelete(null)}></div>
            <div className="bg-gray-900 rounded-[3rem] p-12 max-w-md w-full relative z-10 shadow-[0_0_100px_rgba(244,63,94,0.2)] animate-scaleIn border border-rose-500/20 text-center">
                <div className="bg-rose-500/10 w-24 h-24 rounded-[2rem] border border-rose-500/30 flex items-center justify-center mx-auto mb-8 text-rose-500 shadow-2xl shadow-rose-500/10">
                    <AlertTriangle size={48} className="animate-pulse" />
                </div>
                <h3 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase">Confirm Decommission</h3>
                <p className="text-gray-500 font-bold leading-relaxed mb-10">
                    Unit <span className="text-rose-400">"{itemToDelete.name}"</span> will be permanently purged from the inventory database. This action is irreversible.
                </p>
                <div className="flex gap-4">
                    <Button
                        onClick={() => setItemToDelete(null)}
                        className="flex-1 py-5 bg-white/5 hover:bg-white/10 border-white/5 text-gray-400 font-black uppercase tracking-widest text-xs"
                    >
                        Abort
                    </Button>
                    <Button
                        onClick={() => {
                            deleteProduct(itemToDelete.id);
                            setItemToDelete(null);
                        }}
                        className="flex-1 py-5 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-rose-900/20"
                    >
                        Purge Unit
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;
