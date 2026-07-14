#!/usr/bin/env python3
"""
Seedr.cc — Magnet to Direct Download (Instant Return)
======================================================
Magnet link paste karo → Seedr mein download hoga → Direct link milega!
Pehli baar mein hi direct link return karega (wait karega download complete hone tak)
"""

import requests
import time
import json
import os
import sys
import argparse

# ─────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────
SEEDR_EMAIL    = "motarola110@gmail.com"
SEEDR_PASSWORD = "Harshad@1234"

TOKEN_FILE = "seedr_token.json"
BASE_URL   = "https://www.seedr.cc/rest"
VIDEO_EXTS = {'.mkv', '.mp4', '.avi', '.mov', '.m4v', '.ts', '.webm'}

# ─────────────────────────────────────────────────────
# TOKEN MANAGEMENT
# ─────────────────────────────────────────────────────
def save_token(data: dict):
    with open(TOKEN_FILE, "w") as f:
        json.dump(data, f)

def load_token() -> dict | None:
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE) as f:
            return json.load(f)
    return None

# ─────────────────────────────────────────────────────
# SEEDR CLIENT
# ─────────────────────────────────────────────────────
class SeedrClient:
    def __init__(self):
        self.session = requests.Session()
        self.token_data = load_token()
        if not self.token_data:
            self._login()

    def _login(self):
        """Email + Password se login karo, token save karo."""
        print("🔐 Logging in to Seedr...")
        resp = self.session.post(
            "https://www.seedr.cc/oauth_test/token.php",
            data={
                "grant_type":    "password",
                "client_id":     "seedr_chrome",
                "client_secret": "",
                "username":      SEEDR_EMAIL,
                "password":      SEEDR_PASSWORD,
            },
            timeout=15
        )
        data = resp.json()
        if "access_token" not in data:
            raise Exception(f"Login failed: {data}")

        self.token_data = data
        save_token(data)
        print("✅ Login successful!")

    def _refresh_token(self):
        """Access token expire ho jaye toh refresh karo."""
        print("🔄 Refreshing token...")
        resp = self.session.post(
            "https://www.seedr.cc/oauth_test/token.php",
            data={
                "grant_type":    "refresh_token",
                "client_id":     "seedr_chrome",
                "client_secret": "",
                "refresh_token": self.token_data.get("refresh_token", ""),
            },
            timeout=15
        )
        data = resp.json()
        if "access_token" in data:
            self.token_data = data
            save_token(data)
            print("✅ Token refreshed!")
        else:
            self._login()

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.token_data['access_token']}",
            "Content-Type": "application/x-www-form-urlencoded",
        }

    def _get(self, endpoint: str) -> dict:
        resp = self.session.get(f"{BASE_URL}/{endpoint}", headers=self._headers(), timeout=15)
        if resp.status_code == 401:
            self._refresh_token()
            resp = self.session.get(f"{BASE_URL}/{endpoint}", headers=self._headers(), timeout=15)
        return resp.json()

    def _post(self, endpoint: str, data: dict) -> dict:
        resp = self.session.post(
            f"{BASE_URL}/{endpoint}",
            headers=self._headers(),
            data=data,
            timeout=15
        )
        if resp.status_code == 401:
            self._refresh_token()
            resp = self.session.post(
                f"{BASE_URL}/{endpoint}",
                headers=self._headers(),
                data=data,
                timeout=15
            )
        return resp.json()

    def _delete(self, endpoint: str) -> dict:
        resp = self.session.delete(f"{BASE_URL}/{endpoint}", headers=self._headers(), timeout=15)
        return resp.json() if resp.content else {}

    def get_storage(self) -> dict:
        return self._get("user")

    def add_magnet(self, magnet: str) -> dict:
        return self._post("transfer/magnet", {"magnet": magnet})

    def get_transfers(self) -> list:
        data = self._get("transfer")
        return data if isinstance(data, list) else data.get("transfers", [])

    def get_folder(self, folder_id: str = "") -> dict:
        endpoint = f"folder/{folder_id}" if folder_id else "folder"
        return self._get(endpoint)

    def get_file_url(self, file_id: int) -> str:
        resp = self.session.get(
            f"{BASE_URL}/file/{file_id}",
            headers=self._headers(),
            allow_redirects=False,
            timeout=15
        )
        if resp.status_code in (301, 302, 303, 307, 308):
            return resp.headers.get("Location", "")
        try:
            return resp.json().get("url", "")
        except Exception:
            return ""

    def delete_folder(self, folder_id: int):
        return self._delete(f"folder/{folder_id}")

    def delete_file(self, file_id: int):
        return self._delete(f"file/{file_id}")

    def delete_transfer(self, transfer_id: int):
        return self._delete(f"transfer/{transfer_id}")

    def get_all_files(self, folder_id: str = "") -> list[dict]:
        """Get all files recursively"""
        all_files = []
        folder_data = self.get_folder(folder_id)
        
        for f in folder_data.get("files", []):
            all_files.append({
                "id":   f["id"],
                "name": f.get("name", ""),
                "size": f.get("size", 0),
                "size_human": _bytes_to_human(f.get("size", 0)),
                "folder_id": folder_id if folder_id else "root",
            })
        
        for sub in folder_data.get("folders", []):
            sub_id = sub.get("id")
            if sub_id:
                sub_files = self.get_all_files(str(sub_id))
                all_files.extend(sub_files)
        
        return all_files

    def wait_for_download(self, poll_interval: int = 3, timeout: int = 300) -> bool:
        """Wait for download to complete with better progress tracking"""
        print("⏳ Waiting for download to complete...", end="", flush=True)
        start = time.time()
        last_progress = -1
        no_transfer_count = 0

        while time.time() - start < timeout:
            transfers = self.get_transfers()
            
            # Agar transfer list empty hai, download complete hai
            if not transfers:
                print("\n✅ Download complete! Processing...")
                return True
            
            # Progress dikhao
            progress = 0
            for t in transfers:
                progress = t.get("progress", 0)
                name = t.get("name", "Unknown")[:40]
                
                if progress != last_progress:
                    print(f"\r⏳ Downloading: {name} — {progress}%   ", end="", flush=True)
                    last_progress = progress
                
                # Agar progress 100% ho, lekin transfer list mein hai, 
                # toh Seedr abhi processing kar raha hai
                if progress >= 99:
                    print("\r🔄 Processing download... (Seedr is preparing file)  ", end="", flush=True)
            
            time.sleep(poll_interval)
        
        print("\n⚠️  Timeout! Download may still be in progress.")
        return False


def _bytes_to_human(b: int) -> str:
    if not b:
        return "N/A"
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if b < 1024:
            return f"{b:.1f} {unit}"
        b /= 1024
    return f"{b:.1f} PB"


# ─────────────────────────────────────────────────────
# MAIN FUNCTION — Instant Download Link
# ─────────────────────────────────────────────────────
def get_direct_link(magnet: str, timeout: int = 300) -> dict:
    """
    MAGNET → DIRECT LINK (Pehli baar mein hi!)
    
    Returns:
        {
            "success": True/False,
            "message": "Status message",
            "direct_url": "https://...",
            "file_name": "movie.mkv",
            "file_size": "1.0 GB",
            "file_id": 12345
        }
    """
    result = {
        "success": False,
        "message": "",
        "direct_url": None,
        "file_name": None,
        "file_size": None,
        "file_id": None
    }
    
    try:
        client = SeedrClient()
        
        # STEP 1: Check existing files (cache check)
        print("\n🔍 Checking if file already exists in Seedr...")
        existing_files = client.get_all_files("")
        
        # Check if same file already exists (by name or size)
        magnet_name = magnet.split("&dn=")
        if len(magnet_name) > 1:
            expected_name = magnet_name[1].split("&")[0]
            for f in existing_files:
                if expected_name in f["name"]:
                    print(f"✅ File already exists: {f['name']}")
                    url = client.get_file_url(f["id"])
                    if url:
                        result["success"] = True
                        result["message"] = "File already cached"
                        result["direct_url"] = url
                        result["file_name"] = f["name"]
                        result["file_size"] = f["size_human"]
                        result["file_id"] = f["id"]
                        return result
        
        # STEP 2: Submit magnet
        print("\n🧲 Submitting magnet to Seedr...")
        add_result = client.add_magnet(magnet)
        
        if add_result.get("error"):
            result["message"] = f"Error: {add_result['error']}"
            return result
        
        print("✅ Magnet submitted successfully!")
        
        # STEP 3: Wait for download to complete
        completed = client.wait_for_download(timeout=timeout)
        
        if not completed:
            result["message"] = "Download timeout"
            return result
        
        # STEP 4: Find the newly downloaded file
        print("\n🔍 Searching for downloaded file...")
        
        # Wait a bit for Seedr to finalize
        time.sleep(2)
        
        # Get all files again
        all_files = client.get_all_files("")
        
        # Find video files
        video_files = []
        for f in all_files:
            ext = os.path.splitext(f["name"])[1].lower()
            if ext in VIDEO_EXTS:
                video_files.append(f)
        
        if not video_files:
            # Agar video nahi mila, sab files dikhao
            print("⚠️  No video files found. Available files:")
            for f in all_files:
                print(f"   - {f['name']} ({f['size_human']})")
            result["message"] = "No video files found"
            return result
        
        # STEP 5: Get direct URL for the first video file
        selected_file = video_files[0]
        print(f"\n✅ Found: {selected_file['name']}")
        print(f"   Size: {selected_file['size_human']}")
        print("   Generating direct link...")
        
        url = client.get_file_url(selected_file["id"])
        
        if not url:
            # Fallback: URL with token
            token = client.token_data.get("access_token", "")
            url = f"{BASE_URL}/file/{selected_file['id']}?access_token={token}"
        
        if url:
            result["success"] = True
            result["message"] = "Direct link generated successfully"
            result["direct_url"] = url
            result["file_name"] = selected_file["name"]
            result["file_size"] = selected_file["size_human"]
            result["file_id"] = selected_file["id"]
            print("✅ Direct link ready!")
        else:
            result["message"] = "Could not generate direct link"
        
        return result
        
    except Exception as e:
        result["message"] = f"Error: {str(e)}"
        return result


# ─────────────────────────────────────────────────────
# COMMAND LINE USAGE
# ─────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description='Seedr.cc Magnet to Direct Download (Instant)')
    parser.add_argument('magnet', nargs='?', help='Magnet link to download')
    parser.add_argument('--timeout', type=int, default=300, help='Wait timeout in seconds (default: 300)')
    parser.add_argument('--json', action='store_true', help='Output in JSON format')
    
    args = parser.parse_args()
    
    # Get magnet link
    magnet = args.magnet
    if not magnet:
        print("=" * 60)
        print("  🌱 Seedr.cc — Instant Direct Link Generator")
        print("=" * 60)
        print("\nℹ️  Pehli baar mein hi direct link milega (wait karein download complete hone tak)")
        magnet = input("\n🧲 Magnet link paste karein: ").strip()
        
        if not magnet.startswith("magnet:"):
            print("⚠️  Valid magnet link nahi hai!")
            sys.exit(1)
    
    # Process
    print("\n" + "=" * 70)
    result = get_direct_link(magnet, timeout=args.timeout)
    
    # Output
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print("\n" + "=" * 70)
        print("📥 DIRECT DOWNLOAD LINK")
        print("=" * 70)
        
        if result["success"]:
            print(f"\n✅ Status: {result['message']}")
            print(f"\n📁 File: {result['file_name']}")
            print(f"📦 Size: {result['file_size']}")
            print(f"\n🔗 Direct URL:")
            print(f"{result['direct_url']}")
            print("\n" + "=" * 70)
            print("💾 Link saved to: seedr_direct_link.txt")
            
            with open("seedr_direct_link.txt", "w") as f:
                f.write(result['direct_url'])
        else:
            print(f"\n❌ Failed: {result['message']}")


if __name__ == "__main__":
    main()