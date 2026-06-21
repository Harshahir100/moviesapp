// src/components/torrent/TorrentList.jsx
import React, { useState } from 'react';
import { Download, Copy, Check, TrendingUp, Users, HardDrive } from 'lucide-react';
import toast from 'react-hot-toast';

const TorrentList = ({ torrents }) => {
    const [copied, setCopied] = useState(null);

    const copyMagnet = (magnet, index) => {
        navigator.clipboard.writeText(magnet).then(() => {
            setCopied(index);
            toast.success('Magnet link copied!');
            setTimeout(() => setCopied(null), 2000);
        }).catch(() => {
            toast.error('Failed to copy');
        });
    };

    const openMagnet = (magnet) => {
        window.open(magnet, '_blank');
        toast.success('Opening magnet link...');
    };

    // Group torrents by quality
    const groupedTorrents = torrents.reduce((acc, torrent) => {
        const quality = torrent.quality || 'Unknown';
        if (!acc[quality]) {
            acc[quality] = [];
        }
        acc[quality].push(torrent);
        return acc;
    }, {});

    // Sort qualities
    const qualityOrder = ['4K', '1080p', '720p', '480p', 'Unknown'];
    const sortedQualities = Object.keys(groupedTorrents).sort(
        (a, b) => qualityOrder.indexOf(a) - qualityOrder.indexOf(b)
    );

    const getQualityBadgeColor = (quality) => {
        const colors = {
            '4K': 'bg-purple-600',
            '1080p': 'bg-blue-600',
            '720p': 'bg-green-600',
            '480p': 'bg-yellow-600',
            'Unknown': 'bg-gray-600'
        };
        return colors[quality] || 'bg-gray-600';
    };

    return (
        <div className="space-y-4">
            {sortedQualities.map((quality) => (
                <div key={quality} className="bg-card-bg rounded-xl border border-gray-800 overflow-hidden">
                    <div className="flex items-center space-x-3 px-4 py-3 bg-gray-800/50 border-b border-gray-800">
                        <span className={`px-2 py-1 ${getQualityBadgeColor(quality)} text-xs font-semibold rounded`}>
                            {quality}
                        </span>
                        <span className="text-gray-400 text-sm">
                            {groupedTorrents[quality].length} torrents
                        </span>
                    </div>
                    <div className="divide-y divide-gray-800">
                        {groupedTorrents[quality].map((torrent, index) => (
                            <div key={torrent.id || index} className="p-4 hover:bg-gray-800/50 transition-colors">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white font-medium truncate">
                                            {torrent.title || torrent.torrent_title}
                                        </h4>
                                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                                            {torrent.size && (
                                                <span className="flex items-center space-x-1">
                                                    <HardDrive size={14} />
                                                    <span>{torrent.size}</span>
                                                </span>
                                            )}
                                            <span className="flex items-center space-x-1">
                                                <TrendingUp size={14} className="text-green-500" />
                                                <span>{torrent.seeders || 0} seeders</span>
                                            </span>
                                            <span className="flex items-center space-x-1">
                                                <Users size={14} className="text-yellow-500" />
                                                <span>{torrent.leechers || 0} leechers</span>
                                            </span>
                                            {torrent.is_hindi_dubbed && (
                                                <span className="text-green-500">🇮🇳 Hindi Dubbed</span>
                                            )}
                                            {torrent.source && (
                                                <span className="text-gray-500">Source: {torrent.source}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                        <button
                                            onClick={() => copyMagnet(torrent.magnet_link || torrent.magnetLink, index)}
                                            className="flex items-center space-x-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors"
                                        >
                                            {copied === index ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                            <span>{copied === index ? 'Copied' : 'Copy'}</span>
                                        </button>
                                        <a
                                            href={torrent.magnet_link || torrent.magnetLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center space-x-1 px-3 py-1.5 bg-netflix-red hover:bg-red-700 rounded-lg text-white text-sm transition-colors"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                openMagnet(torrent.magnet_link || torrent.magnetLink);
                                            }}
                                        >
                                            <Download size={16} />
                                            <span>Download</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TorrentList;