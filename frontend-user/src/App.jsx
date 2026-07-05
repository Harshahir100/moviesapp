// frontend-user/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Movies from './pages/Movies';
import MovieDetail from './pages/MovieDetail';
import Series from './pages/Series';
import SeriesDetail from './pages/SeriesDetail';
import Search from './pages/Search';  // Make sure this is imported
import Header from './components/common/Header';
import Footer from './components/common/Footer';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-[#0a0a1a] text-white">
                <Header />
                <main className="pt-5">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/movies" element={<Movies />} />
                        <Route path="/movie/:id" element={<MovieDetail />} />
                        <Route path="/series" element={<Series />} />
                        <Route path="/series/:id" element={<SeriesDetail />} />
                        <Route path="/search" element={<Search />} />  {/* Add this line */}
                        <Route path="/category/:slug" element={<Movies />} />
                        {/* Add a 404 route */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </main>
                <Footer />
                <Toaster 
                    position="top-right"
                    toastOptions={{
                        duration: 3000,
                        style: {
                            background: '#1a1a2e',
                            color: '#fff',
                            border: '1px solid #e50914',
                        },
                    }}
                />
            </div>
        </Router>
    );
}

// Simple 404 component
const NotFound = () => {
    return (
        <div className="container mx-auto px-4 py-12 text-center">
            <div className="text-6xl mb-4">404</div>
            <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
            <p className="text-gray-400">The page you are looking for does not exist.</p>
            <a href="/" className="inline-block mt-4 px-6 py-2 bg-[#e50914] hover:bg-red-700 rounded-lg text-white transition-colors">
                Go Home
            </a>
        </div>
    );
};

export default App;