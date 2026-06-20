// backend/src/services/torrentScraper.js (Fixed - Proper Size Extraction)
import axios from 'axios';
import * as cheerio from 'cheerio';

const TBP_MIRRORS = [
    'https://thepiratebay0.org',
    'https://tpb.party',
    'https://piratebay.party',
    'https://thepiratebay10.org',
    'https://tpb.zip'
];

export class TorrentScraper {
    
    // Format file size from bytes to human readable
    static formatFileSize(bytes) {
        if (!bytes || bytes === 0) return 'Unknown';
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Parse size string to bytes for comparison
static parseSizeToBytes(sizeStr) {
    if (!sizeStr) return 0;

    const units = {
        B: 1,
        KB: 1024,
        MB: 1048576,
        GB: 1073741824,
        TB: 1099511627776
    };

    const match = sizeStr.match(/([\d.]+)\s*([A-Za-z]+)/);

    if (match) {
        const size = parseFloat(match[1]);
        const unit = match[2].toUpperCase();

        return Math.round(size * (units[unit] || 1));
    }

    return 0;
}

    // Extract quality from title
    static extractQuality(title) {
        if (!title) return 'Unknown';
        const titleLower = title.toLowerCase();
        if (titleLower.includes('2160p') || titleLower.includes('4k')) return '4K';
        if (titleLower.includes('1080p')) return '1080p';
        if (titleLower.includes('720p')) return '720p';
        if (titleLower.includes('480p')) return '480p';
        return 'Unknown';
    }

    // Check if title has Hindi
    static isHindiDubbed(title) {
        if (!title) return false;
        const titleLower = title.toLowerCase();
        const hindiKeywords = [
            'hindi', 'hin', 'हिंदी', 'hindi dubbed', 'hindi audio',
            'hindi 5.1', 'dual audio', 'dubbed in hindi', 'hindi dub',
            'hindi 2.0', 'हिंदी', 'hindhi', 'hindu', 'eng-hindi',
            'hindi english', 'hindi+english', 'hindi 1080p',
            'hindi 720p', 'hindi 480p'
        ];
        
        for (const keyword of hindiKeywords) {
            if (titleLower.includes(keyword)) {
                return true;
            }
        }
        return false;
    }

    // Extract language from title
    static extractLanguage(title) {
        const isHindi = this.isHindiDubbed(title);
        if (isHindi) {
            return { language: 'Hindi', isHindiDubbed: true };
        }
        return { language: 'English', isHindiDubbed: false };
    }

    // Build search query for Hindi
    static buildHindiQuery(query) {
        let cleanQuery = query.replace(/\s*\(\d{4}\)\s*/, '').trim();
        cleanQuery = cleanQuery.replace(/\s*\d{4}\s*/, '').trim();
        
        return [
            `${cleanQuery} Hindi`,
            `${cleanQuery} Hindi Dubbed`,
            `${cleanQuery} Dual Audio`,
            `${cleanQuery} Hindi 1080p`,
            `${cleanQuery} Hindi 720p`,
            `${cleanQuery} Hindi 480p`,
            `Hindi ${cleanQuery}`,
            `${cleanQuery} Eng-Hindi`
        ];
    }

    // IMPROVED: Extract size from various sources
    static extractSizeFromRow(row, $) {
        let size = 'Unknown';
        
        try {
            // Convert row to HTML string for debugging
            const rowHtml = $(row).html();
            
            // Method 1: Find size in detDesc (most reliable)
            const detDesc = $(row).find('.detDesc');
            if (detDesc && detDesc.length > 0) {
                const detDescText = detDesc.text();
                // Look for size pattern in detDesc
                const sizePatterns = [
                    /Size:\s*([\d.]+\s*(GB|MB|KB|TB))/i,
                    /\(([\d.]+\s*(GB|MB|KB|TB))\)/i,
                    /([\d.]+\s*(GB|MB|KB|TB))\s*[,|]/
                ];
                
                for (const pattern of sizePatterns) {
                    const match = detDescText.match(pattern);
                    if (match) {
                        size = match[1] || match[0];
                        if (size && size !== 'Unknown') {
                            return size.trim();
                        }
                    }
                }
            }
            
            // Method 2: Check font elements (TPB standard)
            const fontElements = $(row).find('font');
            if (fontElements && fontElements.length > 1) {
                // Check each font element for size
                fontElements.each((i, elem) => {
                    const text = $(elem).text().trim();
                    const match = text.match(/([\d.]+)\s*(GB|MB|KB|TB)/i);
                    if (match) {
                        size = match[0];
                        return false; // break loop
                    }
                });
            }
            
            // Method 3: Check all text in row with better pattern
            if (size === 'Unknown') {
                const fullText = $(row).text();
                // Look for size in various formats
                const patterns = [
                    /([\d.]+)\s*(GB|GiB|G)\b/i,
                    /([\d.]+)\s*(MB|MiB|M)\b/i,
                    /([\d.]+)\s*(KB|KiB|K)\b/i,
                    /([\d.]+)\s*(TB|TiB|T)\b/i,
                    /Size[:\s]+([\d.]+\s*[GM]B)/i,
                    /\(([\d.]+\s*[GM]B)\)/i,
                    /\[([\d.]+\s*[GM]B)\]/i
                ];
                
                for (const pattern of patterns) {
                    const match = fullText.match(pattern);
                    if (match) {
                        size = match[1] + ' ' + match[2].toUpperCase();
                        if (size && size !== 'Unknown') {
                            return size.trim();
                        }
                    }
                }
            }
            
            // Method 4: Check td elements specifically
            if (size === 'Unknown') {
                const tds = $(row).find('td');
                tds.each((i, td) => {
                    const tdText = $(td).text().trim();
                    const match = tdText.match(/([\d.]+)\s*(GB|MB|KB|TB)/i);
                    if (match) {
                        size = match[0];
                        return false; // break loop
                    }
                });
            }
            
        } catch (error) {
            console.log(`Size extraction error: ${error.message}`);
        }
        
        return size;
    }

    // Search ThePirateBay
    static async searchThePirateBay(query, language = 'all') {
        for (const mirror of TBP_MIRRORS) {
            try {
                const searchUrl = `${mirror}/search/${encodeURIComponent(query)}/0/99/0`;
                console.log(`🌐 Searching: ${searchUrl}`);
                
                const response = await axios.get(searchUrl, {
                    timeout: 20000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5'
                    }
                });
                
                if (!response.data) {
                    console.log(`No data from ${mirror}`);
                    continue;
                }
                
                const $ = cheerio.load(response.data);
                const results = [];
                
                // Find all torrent rows
                let rows = [];
                try {
                    rows = $('#searchResult tr');
                    if (!rows || rows.length === 0) {
                        rows = $('table#searchResult tr');
                    }
                    if (!rows || rows.length === 0) {
                        rows = $('table[align="center"] tr');
                    }
                    if (!rows || rows.length === 0) {
                        rows = $('tr');
                    }
                } catch (error) {
                    console.log(`Error finding rows: ${error.message}`);
                    continue;
                }
                
                if (!rows || rows.length === 0) {
                    console.log(`No rows found on ${mirror}`);
                    continue;
                }
                
                console.log(`Found ${rows.length - 1} torrent entries on ${mirror}`);
                
                // Iterate through rows (skip header)
                for (let i = 1; i < rows.length; i++) {
                    try {
                        const row = rows[i];
                        if (!row) continue;
                        
                        // Get name
                        let name = '';
                        try {
                            const detLink = $(row).find('a.detLink');
                            if (detLink && detLink.length > 0) {
                                name = detLink.text().trim();
                            } else {
                                const firstLink = $(row).find('a').first();
                                if (firstLink && firstLink.length > 0) {
                                    name = firstLink.text().trim();
                                }
                            }
                        } catch (error) {
                            continue;
                        }
                        
                        if (!name || name.length < 5) continue;
                        
                        // Get magnet link
                        let magnetLink = '';
                        try {
                            const magnetElement = $(row).find('a[href^="magnet:"]');
                            if (magnetElement && magnetElement.length > 0) {
                                magnetLink = magnetElement.attr('href');
                            }
                        } catch (error) {
                            continue;
                        }
                        
                        if (!magnetLink) continue;
                        
                        // Get size using improved method
                        const size = this.extractSizeFromRow(row, $);
                        
                        // Get seeders and leechers
                        let seeders = 0, leechers = 0;
                        try {
                            const tdElements = $(row).find('td');
                            if (tdElements && tdElements.length >= 3) {
                                const seedsText = $(tdElements[2]).text().trim();
                                const leechText = $(tdElements[3]).text().trim();
                                seeders = parseInt(seedsText) || 0;
                                leechers = parseInt(leechText) || 0;
                            }
                        } catch (error) {
                            // Use default values
                        }
                        
                        const quality = this.extractQuality(name);
                        const isHindi = this.isHindiDubbed(name);
                        const sizeBytes = this.parseSizeToBytes(size);
                        
                        // Filter based on language
                        if (language === 'hindi' && !isHindi) continue;
                        if (language === 'english' && isHindi) continue;
                        
                        results.push({
                            title: name.substring(0, 500),
                            magnetLink: magnetLink,
                            size: size || 'Unknown',
                            sizeBytes: sizeBytes,
                            quality: quality,
                            seeders: seeders,
                            leechers: leechers,
                            isHindiDubbed: isHindi,
                            language: isHindi ? 'Hindi' : 'English',
                            source: 'ThePirateBay'
                        });
                        
                    } catch (error) {
                        // Skip problematic row
                        continue;
                    }
                }
                
                if (results.length > 0) {
                    console.log(`✅ Found ${results.length} torrents from ${mirror}`);
                    return results.sort((a, b) => b.seeders - a.seeders);
                }
                
            } catch (error) {
                console.error(`❌ Error with ${mirror}:`, error.message);
                continue;
            }
        }
        return [];
    }

    // Main search function
    static async searchTorrents(query, language = 'all') {
        console.log(`\n🔍 =========================================`);
        console.log(`🔍 Search: "${query}"`);
        console.log(`🔍 Language: ${language === 'hindi' ? '🇮🇳 Hindi Only' : language === 'english' ? '🇬🇧 English Only' : '🌍 All'}`);
        console.log(`🔍 =========================================\n`);
        
        let allResults = [];
        
        if (language === 'hindi') {
            const hindiQueries = this.buildHindiQuery(query);
            
            for (const hindiQuery of hindiQueries) {
                console.log(`📝 Trying: "${hindiQuery}"`);
                const results = await this.searchThePirateBay(hindiQuery, 'hindi');
                
                if (results && results.length > 0) {
                    allResults.push(...results);
                    console.log(`✅ Found ${results.length} Hindi torrents!`);
                    break;
                }
                await this.delay(1500);
            }
            
            // Fallback
            if (allResults.length === 0) {
                const simpleQuery = query.replace(/\s*\d{4}\s*/, '').trim();
                console.log(`📝 Fallback: "${simpleQuery}"`);
                const results = await this.searchThePirateBay(simpleQuery, 'hindi');
                if (results && results.length > 0) {
                    allResults.push(...results);
                }
            }
        } else {
            const results = await this.searchThePirateBay(query, language);
            if (results && results.length > 0) {
                allResults = results;
            }
        }
        
        // Remove duplicates
        const uniqueResults = [];
        const seenMagnets = new Set();
        
        for (const result of allResults) {
            if (result && result.magnetLink && !seenMagnets.has(result.magnetLink)) {
                seenMagnets.add(result.magnetLink);
                uniqueResults.push(result);
            }
        }
        
        // Sort by seeders
        uniqueResults.sort((a, b) => b.seeders - a.seeders);
        
        const hindiCount = uniqueResults.filter(r => r.isHindiDubbed).length;
        const englishCount = uniqueResults.filter(r => !r.isHindiDubbed).length;
        
        console.log(`\n📊 =========================================`);
        console.log(`📊 Results: ${uniqueResults.length} total`);
        console.log(`   🇮🇳 Hindi: ${hindiCount}`);
        console.log(`   🇬🇧 English: ${englishCount}`);
        console.log(`📊 =========================================\n`);
        
        if (uniqueResults.length > 0) {
            console.log(`📋 Top Results (with sizes):`);
            uniqueResults.slice(0, 5).forEach((r, i) => {
                console.log(`   ${i+1}. ${r.title.substring(0, 60)}`);
                console.log(`      💾 Size: ${r.size} | 🌟 ${r.seeders} seeds | 🎬 ${r.quality}`);
            });
        }
        
        return uniqueResults.slice(0, 40);
    }
    
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}