import React, { useState, useEffect } from 'react';

const PrintingProgress = ({ createdAt, status }) => {
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('Initializing Print...');

    useEffect(() => {
        if (status !== 'pending') {
            setProgress(100);
            setMessage(status === 'shipped' ? 'Dispatch Successful' : 'Print Finalized');
            return;
        }

        const calculateProgress = () => {
            const start = new Date(createdAt).getTime();
            const now = Date.now();
            const duration = 2 * 60 * 60 * 1000; // Simulate 2 hour print time for demo
            const elapsed = now - start;
            const percentage = Math.min(Math.floor((elapsed / duration) * 100), 99);

            setProgress(percentage);

            const layers = 450;
            const currentLayer = Math.floor((percentage / 100) * layers);

            if (percentage < 5) setMessage('Calibrating Build Plate...');
            else if (percentage < 15) setMessage('Heating Extruder (210°C)...');
            else if (percentage < 90) setMessage(`Layer ${currentLayer}/${layers}: Depositing PLA...`);
            else setMessage('Post-Production Polishing...');
        };

        calculateProgress();
        const interval = setInterval(calculateProgress, 5000);
        return () => clearInterval(interval);
    }, [createdAt, status]);

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] animate-pulse">
                    {message}
                </span>
            </div>
        </div>
    );
};

export default PrintingProgress;
