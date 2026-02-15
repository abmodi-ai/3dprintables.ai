import React, { useState, useEffect } from 'react';
import { Clock, User as UserIcon, PackageSearch, Bookmark, MessageSquare } from 'lucide-react';
import Button from '../components/ui/Button';
import AccountHeader from '../components/account/AccountHeader';
import OrderManifest from '../components/account/OrderManifest';
import BlueprintCard from '../components/account/BlueprintCard';
import ChatSessionCard from '../components/account/ChatSessionCard';

const UserAccountPage = ({ user, logout, setView, addToCart, onAuthSuccess, onViewChat }) => {
    const [orders, setOrders] = useState([]);
    const [blueprints, setBlueprints] = useState([]);
    const [chatSessions, setChatSessions] = useState([]);
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
            const response = await fetch('/api/users/add-credits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, amount })
            });
            const data = await response.json();
            if (data.success) {
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
            // Fetch all three in parallel, but handle each independently
            // so one failure doesn't block the others
            const [ordersRes, blueRes, chatsRes] = await Promise.all([
                fetch(`/api/orders/user/${user.id}`).catch(() => null),
                fetch(`/api/blueprints/user/${user.id}`).catch(() => null),
                fetch(`/api/chat/sessions/user/${user.id}`).catch(() => null)
            ]);

            if (ordersRes && ordersRes.ok) {
                const ordersData = await ordersRes.json();
                setOrders(ordersData);
            }
            if (blueRes && blueRes.ok) {
                const blueData = await blueRes.json();
                setBlueprints(blueData);
            }
            if (chatsRes && chatsRes.ok) {
                const chatsData = await chatsRes.json();
                setChatSessions(chatsData);
            }
        } catch (error) {
            console.error('Failed to fetch account data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-12 sm:py-20 text-center">
                <div className="bg-white/5 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                    <UserIcon className="text-purple-500" size={32} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">Please Sign In</h2>
                <p className="text-gray-400 mb-8 max-w-md mx-auto font-bold text-sm sm:text-base px-4">Sign in to view your 3D printing orders and saved designs.</p>
                <Button onClick={() => setView('home')}>Go to Homepage</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 max-w-5xl">
            <AccountHeader
                user={user}
                logout={logout}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onAddCredits={handleGrantCredits}
            />

            {isLoading ? (
                <div className="text-center py-12 sm:py-20">
                    <Clock className="animate-spin mx-auto text-purple-500 mb-4" size={36} />
                    <p className="text-gray-500 font-black uppercase tracking-widest text-xs sm:text-sm">Loading...</p>
                </div>
            ) : activeTab === 'manifests' ? (
                /* Manifests Section */
                <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
                    <div className="mb-4 sm:mb-6 px-1 sm:px-4">
                        <h3 className="text-xl sm:text-2xl font-black text-white mb-2">Your Quote Requests</h3>
                        <p className="text-gray-500 font-bold text-sm">Track the status of your custom 3D print quote requests.</p>
                    </div>

                    {orders.length === 0 ? (
                        <div className="bg-white/5 rounded-2xl sm:rounded-[3rem] border border-dashed border-white/10 p-10 sm:p-20 text-center">
                            <PackageSearch className="mx-auto text-gray-700 mb-4" size={48} />
                            <h4 className="text-xl sm:text-2xl font-black text-gray-600">No quote requests yet</h4>
                            <p className="text-gray-500 font-bold mt-2 mb-6 sm:mb-8 text-sm">Ready to create your first design?</p>
                            <Button onClick={() => setView('home')}>Start Designing</Button>
                        </div>
                    ) : (
                        orders.map(order => (
                            <OrderManifest key={order.id} order={order} onViewChat={onViewChat} />
                        ))
                    )}
                </div>
            ) : activeTab === 'blueprints' ? (
                /* Blueprints Section */
                <div className="animate-in fade-in duration-500">
                    <div className="mb-6 sm:mb-10 px-1 sm:px-4">
                        <h3 className="text-xl sm:text-2xl font-black text-white mb-2">Your Saved Designs</h3>
                        <p className="text-gray-500 font-bold text-sm">Your personal collection of saved AI-generated designs.</p>
                    </div>

                    {blueprints.length === 0 ? (
                        <div className="bg-white/5 rounded-2xl sm:rounded-[3rem] border border-dashed border-white/10 p-10 sm:p-20 text-center">
                            <Bookmark size={48} className="mx-auto text-gray-700 mb-4" />
                            <h4 className="text-xl sm:text-2xl font-black text-gray-600">No saved designs yet</h4>
                            <p className="text-gray-500 font-bold mt-2 mb-6 sm:mb-8 text-sm">Save your AI designs to see them here.</p>
                            <Button onClick={() => setView('home')}>Start Designing</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
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
            ) : (
                /* Chat History Section */
                <div className="animate-in fade-in duration-500">
                    <div className="mb-6 sm:mb-10 px-1 sm:px-4">
                        <h3 className="text-xl sm:text-2xl font-black text-white mb-2">Your Chat History</h3>
                        <p className="text-gray-500 font-bold text-sm">Browse your past design conversations with our AI.</p>
                    </div>

                    {chatSessions.length === 0 ? (
                        <div className="bg-white/5 rounded-2xl sm:rounded-[3rem] border border-dashed border-white/10 p-10 sm:p-20 text-center">
                            <MessageSquare size={48} className="mx-auto text-gray-700 mb-4" />
                            <h4 className="text-xl sm:text-2xl font-black text-gray-600">No chat history yet</h4>
                            <p className="text-gray-500 font-bold mt-2 mb-6 sm:mb-8 text-sm">Start a design conversation to see it here.</p>
                            <Button onClick={() => setView('home')}>Start Designing</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {chatSessions.map(session => (
                                <ChatSessionCard
                                    key={session.id}
                                    session={session}
                                    onView={onViewChat}
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
