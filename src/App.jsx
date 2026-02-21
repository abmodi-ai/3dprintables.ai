import React, { useState, useEffect } from 'react';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Hero from './components/home/Hero';
import HowItWorks from './components/home/HowItWorks';
import LoadingScreen from './components/common/LoadingScreen';
import BackgroundEffects from './components/common/BackgroundEffects';
import CreditsModal from './components/common/CreditsModal';
import LabAmbience from './components/common/LabAmbience';

// Pages
import AIChatPage from './pages/AIChatPage';
import SearchPage from './pages/SearchPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminDashboard from './pages/AdminDashboard';
import UserAccountPage from './pages/UserAccountPage';
import OurStoryPage from './pages/OurStoryPage';
import ChatHistoryView from './pages/ChatHistoryView';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';

// Components
import AuthModal from './components/auth/AuthModal';

// Data
import { INITIAL_PRODUCTS } from './utils/mockData';

const App = () => {
  const [view, setView] = useState(() => {
    const pathname = window.location.pathname;
    if (pathname === '/admin') return 'admin';
    if (pathname === '/reset-password') return 'reset-password';
    if (pathname === '/payment/success') return 'payment-success';
    if (pathname === '/payment/cancel') return 'payment-cancel';
    return 'home';
  });
  const [isAdminRoute, setIsAdminRoute] = useState(() => window.location.pathname === '/admin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Admin auth verification state
  const [adminVerified, setAdminVerified] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(false);
  const [adminAccessDenied, setAdminAccessDenied] = useState(false);

  // Password reset state
  const [resetToken, setResetToken] = useState(() => {
    if (window.location.pathname === '/reset-password') {
      return new URLSearchParams(window.location.search).get('token') || null;
    }
    return null;
  });

  // Chat session state — threaded to Hero and CheckoutPage
  const [chatSessionId, setChatSessionId] = useState(null);
  const [viewChatSessionId, setViewChatSessionId] = useState(null);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  // Handle browser back/forward for /admin and /reset-password URLs
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      if (pathname === '/admin') {
        setView('admin');
        setIsAdminRoute(true);
      } else if (pathname === '/reset-password') {
        const params = new URLSearchParams(window.location.search);
        setResetToken(params.get('token') || null);
        setView('reset-password');
        setIsAdminRoute(false);
      } else if (pathname === '/payment/success') {
        setView('payment-success');
        setIsAdminRoute(false);
      } else if (pathname === '/payment/cancel') {
        setView('payment-cancel');
        setIsAdminRoute(false);
      } else {
        setIsAdminRoute(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auth State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('3dprintables_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('3dprintables_token'));

  // Initialize from LocalStorage
  const [products, setProducts] = useState([]);

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('3dprintables_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch products from database on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/products');
        const data = await response.json();
        if (data && data.length > 0) {
          setProducts(data);
        } else {
          const saved = localStorage.getItem('3dprintables_products');
          setProducts(saved ? JSON.parse(saved) : INITIAL_PRODUCTS);
        }
      } catch {
        // Backend unavailable — fall back to local/mock data silently
        const saved = localStorage.getItem('3dprintables_products');
        setProducts(saved ? JSON.parse(saved) : INITIAL_PRODUCTS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Persistence Effects
  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem('3dprintables_products', JSON.stringify(products));
    }
  }, [products]);

  useEffect(() => {
    localStorage.setItem('3dprintables_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (user) localStorage.setItem('3dprintables_user', JSON.stringify(user));
    else localStorage.removeItem('3dprintables_user');
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem('3dprintables_token', token);
    else localStorage.removeItem('3dprintables_token');
  }, [token]);

  // Admin verification: check role when view is 'admin' and user is logged in
  useEffect(() => {
    if (view === 'admin' && user && token) {
      setAdminCheckLoading(true);
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.role === 'admin') {
            setAdminVerified(true);
            setAdminAccessDenied(false);
          } else {
            setAdminVerified(false);
            setAdminAccessDenied(true);
          }
        })
        .catch(() => {
          setAdminVerified(false);
          setAdminAccessDenied(true);
        })
        .finally(() => setAdminCheckLoading(false));
    } else if (view === 'admin' && !user) {
      setAdminVerified(false);
      setAdminAccessDenied(false);
    } else if (view !== 'admin') {
      setAdminVerified(false);
      setAdminAccessDenied(false);
    }
  }, [view, user, token]);

  // Auth Functions
  const handleAuthSuccess = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('3dprintables_user');
    localStorage.removeItem('3dprintables_token');
  };

  // Cart Functions
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const addNewProduct = (product) => {
    setProducts(prev => [product, ...prev]);
  };

  const addBulkProducts = (newProducts) => {
    setProducts(prev => [...newProducts, ...prev]);
  };

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen neon-bg font-['Outfit'] text-white flex flex-col selection:bg-purple-500/30 selection:text-white relative">
      <div className="neon-grid"></div>

      <LoadingScreen isLoading={isLoading} />
      <BackgroundEffects />

      <Navbar
        cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
        setView={setView}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        user={user}
        logout={logout}
        openAuth={() => setIsAuthModalOpen(true)}
      />

      <main className="flex-1">
        <div style={{ display: view === 'home' ? 'block' : 'none' }}>
          <Hero setView={setView} addToCart={addToCart} user={user} chatSessionId={chatSessionId} setChatSessionId={setChatSessionId} />
          <HowItWorks />
        </div>
        {view === 'our-story' && <OurStoryPage setView={setView} />}
        {view === 'chat-history' && (
          <ChatHistoryView
            sessionId={viewChatSessionId}
            setView={setView}
            setChatSessionId={setChatSessionId}
          />
        )}
        {view === 'search' && <SearchPage setView={setView} />}
        {view === 'cart' && (
          <CheckoutPage
            cart={cart}
            removeFromCart={removeFromCart}
            updateQuantity={updateQuantity}
            clearCart={clearCart}
            setView={setView}
            user={user}
            onAuthSuccess={handleAuthSuccess}
            openAuth={() => setIsAuthModalOpen(true)}
            chatSessionId={chatSessionId}
          />
        )}
        {view === 'admin' && (
          <>
            {/* Not logged in: show auth prompt */}
            {!user && (
              <div className="container mx-auto px-4 py-32 text-center">
                <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-purple-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">Admin Login Required</h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">Please sign in with an admin account to access the dashboard.</p>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-black hover:scale-105 transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Logged in, checking role */}
            {user && adminCheckLoading && (
              <div className="container mx-auto px-4 py-32 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-6"></div>
                <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Verifying admin access...</p>
              </div>
            )}

            {/* Logged in, access denied */}
            {user && !adminCheckLoading && adminAccessDenied && (
              <div className="container mx-auto px-4 py-32 text-center">
                <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>
                </div>
                <h2 className="text-3xl font-black text-red-400 mb-4 tracking-tighter">Access Denied</h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">Your account does not have admin privileges.</p>
                <button
                  onClick={() => { setView('home'); if (isAdminRoute) window.history.pushState({}, '', '/'); }}
                  className="bg-white/10 text-white px-8 py-3 rounded-2xl font-black border border-white/10 hover:bg-white/20 transition-all"
                >
                  Go Home
                </button>
              </div>
            )}

            {/* Logged in, verified admin */}
            {user && !adminCheckLoading && adminVerified && (
              <AdminDashboard
                addNewProduct={addNewProduct}
                addBulkProducts={addBulkProducts}
                deleteProduct={deleteProduct}
                products={products}
                setView={(v) => {
                  setView(v);
                  if (isAdminRoute) window.history.pushState({}, '', '/');
                }}
                token={token}
              />
            )}
          </>
        )}
        {view === 'payment-success' && (
          <PaymentSuccessPage setView={(v) => { setView(v); window.history.pushState({}, '', '/'); }} />
        )}
        {view === 'payment-cancel' && (
          <PaymentCancelPage setView={(v) => { setView(v); window.history.pushState({}, '', '/'); }} />
        )}
        {view === 'reset-password' && (
          <ResetPasswordPage
            token={resetToken}
            setView={(v) => {
              setView(v);
              window.history.pushState({}, '', '/');
            }}
            openAuth={() => setIsAuthModalOpen(true)}
          />
        )}
        {view === 'account' && (
          <UserAccountPage
            user={user}
            logout={logout}
            setView={setView}
            addToCart={addToCart}
            onAuthSuccess={handleAuthSuccess}
            onViewChat={(sessionId) => { setViewChatSessionId(sessionId); setView('chat-history'); }}
          />
        )}
      </main>

      <Footer setView={setView} />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <LabAmbience />
    </div>
  );
};

export default App;
