// backend/src/services/torrentScraper.js
// TPB + RARBG Parallel Search — Hindi Priority
import axios from 'axios';
import * as cheerio from 'cheerio';

const RARBG_MIRRORS = [
    'https://www.proxyrarbg.to',
    'https://proxyrarbg.to',
    'https://rarbgmirror.com',
    'https://rarbgproxy.to',
    'https://rarbg.tw',
    'https://rarbgaccess.org',
];

const TPB_MIRRORS = [
    'https://thepiratebay0.org',
    'https://tpb.party',
    'https://piratebay.party',
    'https://thepiratebay10.org',
    'https://tpb.zip'
];

export class TorrentScraper {

    // ─────────────────────────────────────────────────────────────
    // UTILITY FUNCTIONS (same as before — untouched)
    // ─────────────────────────────────────────────────────────────

    static formatFileSize(bytes) {
        if (!bytes || bytes === 0) return 'Unknown';
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static parseSizeToBytes(sizeStr) {
        if (!sizeStr) return 0;
        const units = { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 };
        const match = sizeStr.match(/([\d.]+)\s*([A-Za-z]+)/);
        if (match) {
            const size = parseFloat(match[1]);
            const unit = match[2].toUpperCase();
            return Math.round(size * (units[unit] || 1));
        }
        return 0;
    }

    static extractQuality(title) {
        if (!title) return 'Unknown';
        const t = title.toLowerCase();
        if (t.includes('2160p') || t.includes('4k')) return '4K';
        if (t.includes('1080p')) return '1080p';
        if (t.includes('720p')) return '720p';
        if (t.includes('480p')) return '480p';
        return 'Unknown';
    }

    static isHindiDubbed(title) {
        if (!title) return false;
        const t = title.toLowerCase();
        const keywords = [
            'hindi', 'hin', 'hindi dubbed', 'hindi audio',
            'hindi 5.1', 'dual audio', 'dubbed in hindi', 'hindi dub',
            'hindi 2.0', 'hindhi', 'eng-hindi',
            'hindi english', 'hindi+english', 'hindi 1080p',
            'hindi 720p', 'hindi 480p', 'multi audio', 'multi-audio'
        ];
        return keywords.some(kw => t.includes(kw));
    }

    static extractLanguage(title) {
        const isHindi = this.isHindiDubbed(title);
        return isHindi
            ? { language: 'Hindi', isHindiDubbed: true }
            : { language: 'English', isHindiDubbed: false };
    }

    static buildHindiQuery(query) {
        let q = query.replace(/\s*\(\d{4}\)\s*/, '').replace(/\s*\d{4}\s*/, '').trim();
        return [
            `${q} Hindi`,
            `${q} Hindi Dubbed`,
            `${q} Dual Audio`,
            `${q} Hindi 1080p`,
            `${q} Hindi 720p`,
            `${q} Hindi 480p`,
            `Hindi ${q}`,
            `${q} Eng-Hindi`
        ];
    }

    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ─────────────────────────────────────────────────────────────
    // TPB size extractor (same as before — untouched)
    // ─────────────────────────────────────────────────────────────
    static extractSizeFromRow(row, $) {
        let size = 'Unknown';
        try {
            const detDesc = $(row).find('.detDesc');
            if (detDesc.length) {
                const text = detDesc.text();
                const patterns = [
                    /Size:\s*([\d.]+\s*(GB|MB|KB|TB))/i,
                    /\(([\d.]+\s*(GB|MB|KB|TB))\)/i,
                    /([\d.]+\s*(GB|MB|KB|TB))\s*[,|]/
                ];
                for (const p of patterns) {
                    const m = text.match(p);
                    if (m) return (m[1] || m[0]).trim();
                }
            }
            $(row).find('font').each((i, el) => {
                const m = $(el).text().trim().match(/([\d.]+)\s*(GB|MB|KB|TB)/i);
                if (m) { size = m[0]; return false; }
            });
            if (size === 'Unknown') {
                const full = $(row).text();
                const patterns = [
                    /([\d.]+)\s*(GB|GiB|G)\b/i,
                    /([\d.]+)\s*(MB|MiB|M)\b/i,
                    /([\d.]+)\s*(KB|KiB|K)\b/i,
                    /([\d.]+)\s*(TB|TiB|T)\b/i,
                    /Size[:\s]+([\d.]+\s*[GM]B)/i,
                    /\(([\d.]+\s*[GM]B)\)/i,
                    /\[([\d.]+\s*[GM]B)\]/i
                ];
                for (const p of patterns) {
                    const m = full.match(p);
                    if (m) return (m[1] + ' ' + m[2].toUpperCase()).trim();
                }
            }
            if (size === 'Unknown') {
                $(row).find('td').each((i, td) => {
                    const m = $(td).text().trim().match(/([\d.]+)\s*(GB|MB|KB|TB)/i);
                    if (m) { size = m[0]; return false; }
                });
            }
        } catch (e) {
            console.log(`Size extraction error: ${e.message}`);
        }
        return size;
    }

    // ─────────────────────────────────────────────────────────────
    // SOURCE 1 — TPB Search
    // ─────────────────────────────────────────────────────────────
    static async searchTPB(query, hindiOnly = false) {
        for (const mirror of TPB_MIRRORS) {
            try {
                const url = `${mirror}/search/${encodeURIComponent(query)}/0/99/0`;
                console.log(`   [TPB] ${url}`);

                const response = await axios.get(url, {
                    timeout: 20000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5'
                    }
                });

                if (!response.data) continue;
                const $ = cheerio.load(response.data);
                const results = [];

                let rows = $('#searchResult tr');
                if (!rows.length) rows = $('table#searchResult tr');
                if (!rows.length) rows = $('table[align="center"] tr');
                if (!rows.length) rows = $('tr');
                if (!rows.length) { console.log(`   [TPB] No rows on ${mirror}`); continue; }

                console.log(`   [TPB] ${rows.length - 1} rows on ${mirror}`);

                for (let i = 1; i < rows.length; i++) {
                    try {
                        const row = rows[i];
                        let name = '';
                        const detLink = $(row).find('a.detLink');
                        name = detLink.length ? detLink.text().trim() : $(row).find('a').first().text().trim();
                        if (!name || name.length < 5) continue;

                        const magnetEl = $(row).find('a[href^="magnet:"]');
                        const magnetLink = magnetEl.length ? magnetEl.attr('href') : null;
                        if (!magnetLink) continue;

                        const isHindi = this.isHindiDubbed(name);
                        if (hindiOnly && !isHindi) continue;

                        const size = this.extractSizeFromRow(row, $);
                        const tds = $(row).find('td');
                        const seeders = tds.length >= 3 ? parseInt($(tds[2]).text().trim()) || 0 : 0;
                        const leechers = tds.length >= 4 ? parseInt($(tds[3]).text().trim()) || 0 : 0;

                        results.push({
                            title: name.substring(0, 500),
                            magnetLink,
                            size: size || 'Unknown',
                            sizeBytes: this.parseSizeToBytes(size),
                            quality: this.extractQuality(name),
                            seeders,
                            leechers,
                            isHindiDubbed: isHindi,
                            language: isHindi ? 'Hindi' : 'English',
                            source: 'ThePirateBay'
                        });
                    } catch (_) { continue; }
                }

                if (results.length > 0) {
                    console.log(`   [TPB] ✅ ${results.length} results`);
                    return results.sort((a, b) => b.seeders - a.seeders);
                }
            } catch (e) {
                console.error(`   [TPB] ❌ ${mirror}: ${e.message}`);
                continue;
            }
        }
        return [];
    }

    // ─────────────────────────────────────────────────────────────
    // SOURCE 2 — RARBG Detail Page Parser
    // ─────────────────────────────────────────────────────────────
    static async parseRarbgDetailPage(detailUrl) {
        const meta = { magnet: null, size: 'Unknown', seeders: 0, leechers: 0, year: 'N/A' };
        try {
            const response = await axios.get(detailUrl, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                }
            });
            const html = response.data;
            const $ = cheerio.load(html);

            // Magnet — regex method (Flask app se same)
            const magMatch = html.match(/href="(magnet:\?[^"]+)"/);
            if (magMatch) {
                meta.magnet = magMatch[1];
            } else {
                const a = $('a[href^="magnet:"]').first();
                if (a.length) meta.magnet = a.attr('href');
            }

            // Size / Year / Peers from key-value table
            $('td').each((_, td) => {
                const label = $(td).text().trim();
                const val = $(td).next('td').text().trim();
                if (label.includes('Size:')) meta.size = val || 'Unknown';
                else if (label.includes('Year:')) meta.year = val || 'N/A';
                else if (label.includes('Peers:')) {
                    const s = val.match(/Seeders\s*:\s*(\d+)/i);
                    const l = val.match(/Leechers\s*:\s*(\d+)/i);
                    if (s) meta.seeders = parseInt(s[1]);
                    if (l) meta.leechers = parseInt(l[1]);
                }
            });
        } catch (e) {
            console.log(`   [RARBG] Detail error: ${e.message}`);
        }
        return meta;
    }

    // ─────────────────────────────────────────────────────────────
    // SOURCE 2 — RARBG Search
    // ─────────────────────────────────────────────────────────────
    static async searchRARBG(query, hindiOnly = false) {
        for (const baseUrl of RARBG_MIRRORS) {
            try {
                const url = `${baseUrl}/search/?search=${encodeURIComponent(query)}`;
                console.log(`   [RARBG] ${url}`);

                const response = await axios.get(url, {
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    }
                });

                const $ = cheerio.load(response.data);
                const results = [];
                const seenMagnets = new Set();

                let rows = $('tr.lista2, tr.lista, tr.row');
                if (!rows.length) {
                    const els = $('a[href*="/torrent/"]').map((_, a) => $(a).closest('tr').get(0)).toArray();
                    rows = $(els);
                }
                if (!rows.length) { console.log(`   [RARBG] No rows on ${baseUrl}`); continue; }

                console.log(`   [RARBG] ${rows.length} rows on ${baseUrl}`);

                for (let i = 0; i < Math.min(rows.length, 12); i++) {
                    const row = rows[i];
                    const linkTag = $(row).find('a[href*="/torrent/"]').first();
                    if (!linkTag.length) continue;

                    const title = linkTag.text().trim();
                    if (!title) continue;

                    const isHindi = this.isHindiDubbed(title);
                    if (hindiOnly && !isHindi) continue;

                    const href = linkTag.attr('href');
                    const detailUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
                    const meta = await this.parseRarbgDetailPage(detailUrl);
                    if (!meta.magnet || seenMagnets.has(meta.magnet)) continue;
                    seenMagnets.add(meta.magnet);

                    const cols = $(row).find('td');
                    let { size, seeders, leechers } = meta;
                    if (size === 'Unknown' && cols.length >= 4) size = $(cols[3]).text().trim() || 'Unknown';
                    if (seeders === 0 && cols.length >= 6) {
                        seeders = parseInt($(cols[4]).text().trim()) || 0;
                        leechers = parseInt($(cols[5]).text().trim()) || 0;
                    }

                    results.push({
                        title: title.substring(0, 500),
                        magnetLink: meta.magnet,
                        size,
                        sizeBytes: this.parseSizeToBytes(size),
                        quality: this.extractQuality(title),
                        seeders,
                        leechers,
                        isHindiDubbed: isHindi,
                        language: isHindi ? 'Hindi' : 'English',
                        source: 'RARBG',
                        year: meta.year,
                    });

                    await this.delay(300);
                }

                if (results.length > 0) {
                    console.log(`   [RARBG] ✅ ${results.length} results`);
                    return results;
                }
            } catch (e) {
                console.error(`   [RARBG] ❌ ${baseUrl}: ${e.message}`);
                continue;
            }
        }
        return [];
    }

    // ─────────────────────────────────────────────────────────────
    // PARALLEL SEARCH — TPB + RARBG ek saath
    // ─────────────────────────────────────────────────────────────
    static async searchBothParallel(query, hindiOnly = false) {
        console.log(`\n   🚀 Parallel: TPB + RARBG — "${query}"`);

        const [tpbRes, rarbgRes] = await Promise.allSettled([
            this.searchTPB(query, hindiOnly),
            this.searchRARBG(query, hindiOnly),
        ]);

        const tpb   = tpbRes.status   === 'fulfilled' ? tpbRes.value   : [];
        const rarbg = rarbgRes.status === 'fulfilled' ? rarbgRes.value : [];

        console.log(`   [Parallel done] TPB: ${tpb.length} | RARBG: ${rarbg.length}`);
        return [...tpb, ...rarbg];
    }

    // ─────────────────────────────────────────────────────────────
    // MAIN SEARCH — same interface as before
    // ─────────────────────────────────────────────────────────────
    static async searchTorrents(query, language = 'all') {
        console.log(`\n🔍 =========================================`);
        console.log(`🔍 Search: "${query}"`);
        console.log(`🔍 Language: ${language === 'hindi' ? '🇮🇳 Hindi Only' : language === 'english' ? '🇬🇧 English Only' : '🌍 All'}`);
        console.log(`🔍 Sources: TPB + RARBG (Parallel)`);
        console.log(`🔍 =========================================\n`);

        let allResults = [];

        if (language === 'hindi') {
            // Phase 1: Hindi variants — dono parallel
            const hindiQueries = this.buildHindiQuery(query);
            for (const hq of hindiQueries) {
                console.log(`📝 Trying: "${hq}"`);
                const results = await this.searchBothParallel(hq, true);
                if (results.length > 0) {
                    allResults.push(...results);
                    console.log(`✅ Found ${results.length} Hindi torrents!`);
                    break;
                }
                await this.delay(1500);
            }

            // Phase 2: Generic + Hindi filter — parallel fallback
            if (allResults.length === 0) {
                const simple = query.replace(/\s*\d{4}\s*/, '').trim();
                console.log(`📝 Fallback: "${simple}"`);
                const results = await this.searchBothParallel(simple, true);
                allResults.push(...results);
            }

            // Phase 3: English fallback — parallel
            if (allResults.length === 0) {
                console.log(`⚠️  Hindi nahi mila, English fallback...`);
                const results = await this.searchBothParallel(query, false);
                allResults.push(...results);
            }

        } else {
            // English / All
            allResults = await this.searchBothParallel(query, false);
        }

        // Deduplicate by magnetLink
        const unique = [];
        const seen = new Set();
        for (const r of allResults) {
            if (r?.magnetLink && !seen.has(r.magnetLink)) {
                seen.add(r.magnetLink);
                unique.push(r);
            }
        }

        // Sort: Hindi first → then by seeders
        unique.sort((a, b) => {
            if (a.isHindiDubbed && !b.isHindiDubbed) return -1;
            if (!a.isHindiDubbed && b.isHindiDubbed) return 1;
            return b.seeders - a.seeders;
        });

        const hindiCount   = unique.filter(r => r.isHindiDubbed).length;
        const englishCount = unique.length - hindiCount;
        const tpbCount     = unique.filter(r => r.source === 'ThePirateBay').length;
        const rarbgCount   = unique.filter(r => r.source === 'RARBG').length;

        console.log(`\n📊 =========================================`);
        console.log(`📊 Results: ${unique.length} total`);
        console.log(`   🇮🇳 Hindi:   ${hindiCount}`);
        console.log(`   🇬🇧 English: ${englishCount}`);
        console.log(`   📡 TPB:      ${tpbCount}`);
        console.log(`   📡 RARBG:    ${rarbgCount}`);
        console.log(`📊 =========================================\n`);

        if (unique.length > 0) {
            console.log(`📋 Top Results:`);
            unique.slice(0, 5).forEach((r, i) => {
                console.log(`   ${i + 1}. [${r.source}] ${r.title.substring(0, 55)}`);
                console.log(`      💾 ${r.size} | 🌟 ${r.seeders} seeds | 🎬 ${r.quality} | ${r.isHindiDubbed ? '🇮🇳 Hindi' : '🌐 English'}`);
            });
        }

        return unique.slice(0, 40);
    }
}