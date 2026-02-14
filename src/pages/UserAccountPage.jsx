import React, { useState, useEffect } from 'react';
import { Clock, User as UserIcon, PackageSearch, Bookmark } from 'lucide-react';
import Button from '../components/ui/Button';
import AccountHeader from '../components/account/AccountHeader';
import OrderManifest from '../components/account/OrderManifest';
import BlueprintCard from '../components/account/BlueprintCard';

const UserAccountPage = ({ user, logout, setView, addToCart, onAuthSuccess }) => {
    const [orders, setOrders] = useState([]);
    const [blueprints, setBlueprints] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('manifests');

    useEffect(() => {
        if (user) {
            fetchData();
        } else {
            setIsLoading(false);
        }
    }, [user]);

    const handleGrantCredits = async (amount) => {
        try {
            const response = await fetch('http://localhost:3001/api/users/add-credits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, amount })
            });
            const data = await response.json();
            if (data.success) {
                // Update global user state (assuming onAuthSuccess updates the user in App.jsx)
                const updatedUser = { ...user, credits: parseFloat(data.newBalance) };
                onAuthSuccess(updatedUser, localStorage.getItem('token'));
            }
        } catch (error) {
            console.error('Failed to grant credits:', error);
        }
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [ordersRes, blueRes] = await Promise.all([
                fetch(`http://localhost:3001/api/orders/user/${user.id}`),
                fetch(`http://localhost:3001/api/blueprints/user/${user.id}`)
            ]);

            const ordersData = await ordersRes.json();
            const blueData = await blueRes.json();

            setOrders(ordersData);
            setBlueprints(blueData);
        } catch (error) {
            console.error('Failed to fetch account data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                    <UserIcon className="text-purple-500" size={40} />
                </div>
                <h2 className="text-3xl font-black text-white mb-4">Laboratory Access Restricted</h2>
                <p className="text-gray-400 mb-8 max-w-md mx-auto font-bold">Please sign in to view your 3D printing project history and view your orders.</p>
                <Button onClick={() => setView('home')}>Return to Surface</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
            <AccountHeader
                user={user}
                logout={logout}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onAddCredits={handleGrantCredits}
            />

            {isLoading ? (
                <div className="text-center py-20">
                    <Clock className="animate-spin mx-auto text-purple-500 mb-4" size={48} />
                    <p className="text-gray-500 font-black uppercase tracking-widest text-sm">Synchronizing Lab Data...</p>
                </div>
            ) : activeTab === 'manifests' ? (
                /* Manifests Section */
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="mb-6 px-4">
                        <h3 className="text-2xl font-black text-white mb-2">Active Operations</h3>
                        <p className="text-gray-500 font-bold">Live status from your custom 3D printing jobs.</p>
                    </div>

                    {orders.length === 0 ? (
                        <div className="bg-white/5 rounded-[3rem] border border-dashed border-white/10 p-20 text-center">
                            <PackageSearch className="mx-auto text-gray-700 mb-4" size={64} />
                            <h4 className="text-2xl font-black text-gray-600">No active manifests found</h4>
                            <p className="text-gray-500 font-bold mt-2 mb-8">Ready to start your next engineering project?</p>
                            <Button onClick={() => setView('ai-lab')}>Launch AI Lab</Button>
                        </div>
                    ) : (
                        orders.map(order => (
                            <OrderManifest key={order.id} order={order} />
                        ))
                    )}
                </div>
            ) : (
                /* Blueprints Section */
                <div className="animate-in fade-in duration-500">
                    <div className="mb-10 px-4">
                        <h3 className="text-2xl font-black text-white mb-2">Technical Archives</h3>
                        <p className="text-gray-500 font-bold">Your personal collection of saved AI-generated blueprints.</p>
                    </div>

                    {blueprints.length === 0 ? (
                        <div className="bg-white/5 rounded-[3rem] border border-dashed border-white/10 p-20 text-center">
                            <Bookmark size={64} className="mx-auto text-gray-700 mb-4" />
                            <h4 className="text-2xl font-black text-gray-600">Archives Empty</h4>
                            <p className="text-gray-500 font-bold mt-2 mb-8">Save your AI creations to see them here.</p>
                            <Button onClick={() => setView('ai-lab')}>Start Designing</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {blueprints.map(print => (
                                <BlueprintCard
                                    key={print.id}
                                    print={print}
                                    addToCart={addToCart}
                                    setView={setView}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserAccountPage;
