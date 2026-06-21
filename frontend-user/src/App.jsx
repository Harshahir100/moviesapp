// frontend-user/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Movies from './pages/Movies';
import MovieDetail from './pages/MovieDetail';
import Series from './pages/Series';
import SeriesDetail from './pages/SeriesDetail';
import Header from './components/common/Header';
import Footer from './components/common/Footer';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-[#0a0a1a] text-white">
                <Header />
                <main className="pt-16">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/movies" element={<Movies />} />
                        <Route path="/movie/:id" element={<MovieDetail />} />
                        <Route path="/series" element={<Series />} />
                        <Route path="/series/:id" element={<SeriesDetail />} />
                        <Route path="/category/:slug" element={<Movies />} />
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

export default App;