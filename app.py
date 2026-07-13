import requests
import time

# --- CONFIGURATION ---
PIKPAK_EMAIL = "drishty102@gmail.com"  # Apna real email dalein
PIKPAK_PASSWORD = "Harsh@123"        # Apna real password dalein
MAGNET_LINK = "magnet:?xt=urn:btih:4BD509942B88308EF4A23AFAB3C7D99267E15B05&dn=The+End+We+Start+From+%282023%29+720p+AMZN+WEBRip+%5BHindi+AAC.2.0+%2B+English+AAC.5.1%5D+Dual+Audio+AVC+x264+Esub+-+MkvCinema+%5BProtonMovies%5D&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Fexplodie.org%3A6969%2Fannounce&tr=https%3A%2F%2Ftracker.tamersunion.org%3A443%2Fannounce&tr=https%3A%2F%2Ftracker.gbitt.info%3A443%2Fannounce&tr=http%3A%2F%2Ftracker.gbitt.info%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.tiny-vps.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.theoks.net%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.dump.cl%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.bittor.pw%3A1337%2Fannounce&tr=https%3A%2F%2Ftracker.bt4g.com%3A443%2Fannounce&tr=udp%3A%2F%2Fopen.demonii.com%3A1337%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce&tr=http%3A%2F%2Fopen.acgnxtracker.com%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=http%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Fopentracker.i2p.rocks%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fcoppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.zer0day.to%3A1337%2Fannounce"   # Apni magnet link dalein

# Yeh PikPak ka official client ID hai, ise change nahi karna hai
CLIENT_ID = "YUMwZ29vNnFidmNu" 

def run_pikpak_flow():
    session = requests.Session()
    
    # STEP 1: Login karke temporary API Token lena
    print("[*] PikPak me login ho raha hai...")
    login_url = "https://user.mypikpak.com/v1/auth/signin"
    login_data = {
        "client_id": CLIENT_ID,
        "username": PIKPAK_EMAIL,
        "password": PIKPAK_PASSWORD
    }
    
    try:
        login_res = session.post(login_url, json=login_data).json()
        access_token = login_res.get("access_token")
        
        if not access_token:
            print(f"[-] Login Failed! Server response: {login_res}")
            return
            
        print("[+] Login Successful! Temporary API Token mil gaya.")
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # STEP 2: Magnet link cloud me add karna
        print("[*] Magnet link bhej raha hoon...")
        add_url = "https://api-drive.mypikpak.com/drive/v1/task"
        add_data = {"kind": "drive#task", "url": MAGNET_LINK}
        
        task_res = session.post(add_url, json=add_data, headers=headers).json()
        task_id = task_res.get("task", {}).get("id")
        
        if not task_id:
            print(f"[-] Magnet add nahi ho saka: {task_res}")
            return
            
        print(f"[+] Task Created! Task ID: {task_id}")
        print("[*] File ready hone ka wait kar raha hoon (5 seconds)...")
        time.sleep(5)
        
        # STEP 3: File ka status aur direct link check karna
        status_url = f"https://api-drive.mypikpak.com/drive/v1/tasks?id={task_id}"
        status_res = session.get(status_url, headers=headers).json()
        
        tasks = status_res.get("tasks", [])
        if tasks:
            task_status = tasks[0]
            print("\n" + "="*50)
            print(f"File Name: {task_status.get('name')}")
            print(f"Status: {task_status.get('phase')} (PHASE_COMPLETE matlab ready hai)")
            print("="*50)
            print("\n👉 Ab aap apne PikPak app ya website par jaakar is file par click karke DIRECT DOWNLOAD LINK le sakte hain!")
        else:
            print("[-] File status nahi mil saka.")
            
    except Exception as e:
        print(f"[-] Script Error: {e}")

if __name__ == "__main__":
    run_pikpak_flow()