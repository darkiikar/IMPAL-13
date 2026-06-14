"""
Nearify Real Data Seeder - PostgreSQL version
Reads actual images from user_data/ and seeds into PostgreSQL.
"""
import os
import re
import base64
import uuid
import json
import asyncio
import asyncpg
from pathlib import Path
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / '.env')

DATABASE_URL = os.environ['DATABASE_URL']

USER_DATA_PATH = Path(__file__).parent.parent / 'user_data'
FOOD_PATH = USER_DATA_PATH / 'makanan-minuman-dessert'
KOST_PATH = USER_DATA_PATH / 'kost'
LAUNDRY_PATH = USER_DATA_PATH / 'laundry'

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.heic', '.heif'}


def now_utc():
    return datetime.now(timezone.utc)


def detect_image_type(filepath: Path) -> str:
    try:
        with open(filepath, 'rb') as f:
            header = f.read(16)
        if header[:8] == b'\x89PNG\r\n\x1a\n':
            return 'image/png'
        elif header[:3] == b'\xff\xd8\xff':
            return 'image/jpeg'
        elif header[:4] == b'RIFF' and header[8:12] == b'WEBP':
            return 'image/webp'
        elif header[:6] in (b'GIF87a', b'GIF89a'):
            return 'image/gif'
        else:
            return 'image/jpeg'
    except:
        return 'image/jpeg'


def file_to_base64(filepath: Path) -> str:
    try:
        ext = filepath.suffix.lower()
        mime_map = {
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
            '.png': 'image/png', '.webp': 'image/webp',
            '.gif': 'image/gif', '.bmp': 'image/bmp',
            '.heic': 'image/heic', '.heif': 'image/heif',
        }
        mime = mime_map.get(ext) or detect_image_type(filepath)
        with open(filepath, 'rb') as f:
            data = base64.b64encode(f.read()).decode('utf-8')
        return f"data:{mime};base64,{data}"
    except Exception as e:
        print(f"  [ERROR] Cannot convert {filepath}: {e}")
        return ""


def is_image_file(filepath: Path) -> bool:
    if filepath.suffix.lower() in IMAGE_EXTENSIONS:
        return True
    if not filepath.suffix or filepath.suffix.lower() not in {'.docx', '.txt', '.pdf', '.doc'}:
        try:
            with open(filepath, 'rb') as f:
                header = f.read(16)
            if (header[:8] == b'\x89PNG\r\n\x1a\n' or
                    header[:3] == b'\xff\xd8\xff' or
                    (header[:4] == b'RIFF' and header[8:12] == b'WEBP') or
                    header[:6] in (b'GIF87a', b'GIF89a') or
                    header[:2] == b'BM'):
                return True
        except:
            pass
    return False


def parse_menu_filename(filename: str):
    name_without_ext = Path(filename).stem
    patterns = [
        r'^(.+?)\s+([\d.,]+)$',
        r'^(.+?)\s+Rp\.?\s*([\d.,]+)$',
    ]
    for pattern in patterns:
        match = re.match(pattern, name_without_ext, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            price_str = match.group(2).replace('.', '').replace(',', '')
            try:
                price = int(float(price_str))
                if price < 1000:
                    price = price * 1000
                return (name.title(), price)
            except:
                pass
    return (name_without_ext.title(), 0)


def get_category_from_restaurant_name(name: str) -> str:
    name_lower = name.lower()
    if any(x in name_lower for x in ['mie', 'noodle', 'wizze']):
        return 'Mie'
    elif any(x in name_lower for x in ['kopi', 'coffee', 'jus', 'juice', 'fresh', 'tea']):
        return 'Minuman'
    elif any(x in name_lower for x in ['burger', 'fried']):
        return 'Snack'
    elif any(x in name_lower for x in ['donut', 'donlight', 'dessert', 'dikichi']):
        return 'Dessert'
    elif any(x in name_lower for x in ['geprek', 'ayam', 'nasi', 'kremesan', 'sei', 'sapi']):
        return 'Nasi'
    else:
        return 'Makanan'


def find_best_cover_image(menu_items: list, restaurant_name: str) -> str:
    if not menu_items:
        return ""
    restaurant_lower = restaurant_name.lower()
    priority_keywords = []
    if 'mie' in restaurant_lower or 'noodle' in restaurant_lower:
        priority_keywords = ['mie', 'noodle', 'bakmi']
    elif 'burger' in restaurant_lower:
        priority_keywords = ['burger', 'sandwich']
    elif 'geprek' in restaurant_lower or 'ayam' in restaurant_lower:
        priority_keywords = ['geprek', 'ayam', 'nasi']
    elif 'kopi' in restaurant_lower or 'coffee' in restaurant_lower:
        priority_keywords = ['kopi', 'coffee', 'latte']
    elif 'sapi' in restaurant_lower or 'sei' in restaurant_lower:
        priority_keywords = ['sapi', 'sei', 'beef', 'nasi']
    elif 'kremesan' in restaurant_lower:
        priority_keywords = ['kremesan', 'ayam', 'nasi']
    elif 'dikichi' in restaurant_lower:
        priority_keywords = ['dikichi', 'dessert']
    elif 'donlight' in restaurant_lower or 'donut' in restaurant_lower:
        priority_keywords = ['donut', 'donat']
    elif 'jus' in restaurant_lower or 'fresh' in restaurant_lower:
        priority_keywords = ['jus', 'juice', 'salad']

    for menu in menu_items:
        menu_name_lower = menu.get('name', '').lower()
        for keyword in priority_keywords:
            if keyword in menu_name_lower:
                return menu.get('image', '')

    drink_keywords = ['air', 'mineral', 'tea', 'teh', 'es ', 'lemon', 'orange', 'thai']
    if not any(k in restaurant_lower for k in ['kopi', 'coffee', 'jus', 'juice', 'tea', 'minuman', 'fresh']):
        for menu in menu_items:
            menu_name_lower = menu.get('name', '').lower()
            is_drink = any(dk in menu_name_lower for dk in drink_keywords)
            if not is_drink and menu.get('image'):
                return menu.get('image', '')

    return menu_items[0].get('image', '') if menu_items else ""


async def seed_all():
    print("Connecting to PostgreSQL...")
    pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=5)

    async with pool.acquire() as conn:
        # Clear existing data
        print("\n=== CLEARING EXISTING DATA ===")
        for tbl in ['menu_items', 'restaurants', 'laundry_shops', 'laundry_services', 'kost']:
            count = await conn.fetchval(f"DELETE FROM {tbl} RETURNING id", column=0) 
            # simpler approach:
        await conn.execute("DELETE FROM menu_items")
        await conn.execute("DELETE FROM restaurants")
        await conn.execute("DELETE FROM laundry_shops")
        await conn.execute("DELETE FROM laundry_services")
        await conn.execute("DELETE FROM kost")
        print("  Done clearing.")

        # ---- RESTAURANTS & MENU ITEMS ----
        print("\n=== SEEDING RESTAURANTS & MENU ITEMS ===")
        if not FOOD_PATH.exists():
            print(f"  [ERROR] Food path not found: {FOOD_PATH}")
        else:
            for restaurant_folder in sorted(FOOD_PATH.iterdir()):
                if not restaurant_folder.is_dir():
                    continue
                if restaurant_folder.name.startswith('__MACOSX') or restaurant_folder.name.startswith('.'):
                    continue

                folder_name = restaurant_folder.name
                restaurant_name = folder_name.split(' - ')[0].strip().title()
                location = "Purwokerto"
                if ' - ' in folder_name:
                    location_part = folder_name.split(' - ')[1].strip()
                    if location_part:
                        location = location_part.title()

                print(f"  Processing: {restaurant_name}")
                rid = str(uuid.uuid4())
                menu_items = []
                address = f"Jl. {restaurant_name}, {location}"

                for item_file in sorted(restaurant_folder.iterdir()):
                    if not item_file.is_file() or item_file.name.startswith('.'):
                        continue
                    filename_lower = item_file.name.lower()
                    if any(kw in filename_lower for kw in ['alamat', 'address', 'lokasi']):
                        continue
                    if is_image_file(item_file):
                        name, price = parse_menu_filename(item_file.name)
                        image_b64 = file_to_base64(item_file)
                        if not image_b64:
                            continue
                        menu_items.append({
                            "id": str(uuid.uuid4()),
                            "restaurant_id": rid,
                            "name": name,
                            "description": f"Menu {name} dari {restaurant_name}",
                            "price": price if price > 0 else 15000,
                            "image": image_b64,
                            "category": "Main"
                        })
                        print(f"    - {name} @ Rp {price if price > 0 else 15000:,}")

                if not menu_items:
                    print(f"    [SKIP] No menu items")
                    continue

                cover_image = find_best_cover_image(menu_items, restaurant_name)
                rating = round(4.0 + (hash(restaurant_name) % 10) / 10, 1)
                delivery_time = 15 + (hash(restaurant_name) % 20)

                await conn.execute(
                    """INSERT INTO restaurants (id, name, description, image, rating, delivery_time_min,
                       delivery_fee, category, address) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)""",
                    rid, restaurant_name,
                    f"Restoran {restaurant_name} di {location}",
                    cover_image, rating, delivery_time, 5000,
                    get_category_from_restaurant_name(restaurant_name), address
                )
                for m in menu_items:
                    await conn.execute(
                        """INSERT INTO menu_items (id, restaurant_id, name, description, price, image, category)
                           VALUES ($1,$2,$3,$4,$5,$6,$7)""",
                        m["id"], m["restaurant_id"], m["name"], m["description"],
                        m["price"], m["image"], m["category"]
                    )
                print(f"    => Saved {len(menu_items)} menu items")

        # ---- LAUNDRY SHOPS ----
        print("\n=== SEEDING LAUNDRY SHOPS ===")
        legacy_services = [
            ("l1", "Cuci + Setrika", "Layanan lengkap cuci dan setrika rapi", 6000, "tshirt"),
            ("l2", "Cuci Saja", "Cuci bersih dan kering", 4000, "drop"),
            ("l3", "Setrika Saja", "Setrika rapi pakaianmu", 3500, "iron"),
            ("l4", "Express 6 Jam", "Selesai dalam 6 jam, cuci + setrika", 10000, "lightning"),
        ]
        await conn.executemany(
            "INSERT INTO laundry_services (id, name, description, price_per_kg, icon) VALUES ($1,$2,$3,$4,$5)",
            legacy_services
        )

        default_services = [
            {"name": "Cuci + Setrika", "price_per_kg": 6000, "description": "Cuci dan setrika lengkap"},
            {"name": "Cuci Saja", "price_per_kg": 4000, "description": "Cuci tanpa setrika"},
            {"name": "Setrika Saja", "price_per_kg": 3500, "description": "Setrika saja"},
            {"name": "Express 6 Jam", "price_per_kg": 10000, "description": "Layanan kilat 6 jam"},
        ]

        if not LAUNDRY_PATH.exists():
            print(f"  [ERROR] Laundry path not found: {LAUNDRY_PATH}")
        else:
            for folder in sorted(LAUNDRY_PATH.iterdir()):
                if not folder.is_dir() or folder.name.startswith('__MACOSX') or folder.name.startswith('.'):
                    continue

                laundry_name = folder.name.strip().title()
                print(f"  Processing: {laundry_name}")

                address_keywords = ['alamat', 'address', 'lokasi', 'info', 'map', 'peta', 'location']
                non_address_images = []
                address_images = []

                for item_file in sorted(folder.iterdir()):
                    if not item_file.is_file() or item_file.name.startswith('.'):
                        continue
                    if is_image_file(item_file):
                        filename_lower = item_file.name.lower()
                        img_b64 = file_to_base64(item_file)
                        if img_b64:
                            if any(kw in filename_lower for kw in address_keywords):
                                address_images.append(img_b64)
                            else:
                                non_address_images.append(img_b64)
                                print(f"    - {item_file.name}")

                all_images = non_address_images + address_images
                if not all_images:
                    print(f"    [SKIP] No images")
                    continue

                location = "Purwokerto"
                if "gumbreg" in laundry_name.lower():
                    location = "Dr. Gumbreg"

                services_with_ids = [{"id": str(uuid.uuid4()), **svc} for svc in default_services]

                await conn.execute(
                    """INSERT INTO laundry_shops (id, name, description, images, address, location, rating, services, contact, open_hours)
                       VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8::jsonb,$9,$10)""",
                    str(uuid.uuid4()), laundry_name,
                    f"{laundry_name} - Layanan laundry terpercaya di {location}",
                    json.dumps(all_images[:8]),
                    f"Jl. {location}, Purwokerto", location,
                    round(4.0 + (hash(laundry_name) % 10) / 10, 1),
                    json.dumps(services_with_ids), "-", "08:00 - 21:00"
                )
                print(f"    => Saved {len(all_images)} images")

        # ---- KOST ----
        print("\n=== SEEDING KOST ===")
        kost_data = {
            "Ndalem AYYA": {
                "description": "Kost putra dengan fasilitas lengkap. Bangunan baru, dekat Margono dan Kedokteran Unsoed.",
                "price_per_month": 800000, "location": "Berkoh",
                "address": "Perumahan Berkoh Baru No 26, Jln. HM Bahroen, Berkoh, Purwokerto Selatan",
                "latitude": -7.4380, "longitude": 109.2350,
                "facilities": ["WiFi", "CCTV", "Kamar Mandi Dalam", "Kipas Angin", "Kasur", "Lemari", "Dapur Umum", "Parkir Motor"],
                "gender": "putra", "contact": "0851 7500 9668", "available_rooms": 5
            },
            "Kost Aluna Berkoh Residence": {
                "description": "Kost premium dengan Smart TV 43\", AC, dan Water Heater. Ada Rooftop dan Taman.",
                "price_per_month": 2000000, "location": "Berkoh",
                "address": "Jalan Sunan Kalijaga Gg. 5 RT.01/RW.02, Berkoh, Purwokerto Selatan",
                "latitude": -7.4370, "longitude": 109.2360,
                "facilities": ["WiFi", "AC", "Smart TV", "Water Heater", "Kamar Mandi Dalam", "Kasur", "Dapur Bersama", "Rooftop", "CCTV 24 Jam", "Parkir Mobil & Motor"],
                "gender": "campur", "contact": "0851-1771-0661", "available_rooms": 8
            },
            "Indah Kos": {
                "description": "Kost khusus wanita di daerah RSUD Margono. Free WiFi, kebersihan, dan keamanan.",
                "price_per_month": 750000, "location": "Sokaraja",
                "address": "Perbatasan Sokaraja & Purwokerto (Daerah RSUD Margono)",
                "latitude": -7.4200, "longitude": 109.2650,
                "facilities": ["WiFi Gratis", "Dapur Bersama", "Ruang Tamu", "Rooftop Jemur", "CCTV"],
                "gender": "putri", "contact": "081548830821", "available_rooms": 4
            },
            " Kos Dini 1": {
                "description": "Kost wanita dengan kasur springbed dan kamar mandi dalam. Parkiran luas.",
                "price_per_month": 710000, "location": "Arcawinangun",
                "address": "Arcawinangun, Purwokerto",
                "latitude": -7.4150, "longitude": 109.2420,
                "facilities": ["Kasur Springbed", "Meja", "Kursi", "Lemari Anti Jamur", "Kamar Mandi Dalam", "Mesin Cuci", "Kulkas"],
                "gender": "putri", "contact": "085747193363", "available_rooms": 3
            },
            "Kos Budi Kasih (Berkoh)": {
                "description": "Kost wanita di Jl. Sunan Kalijaga, Berkoh. Lokasi strategis dekat kampus.",
                "price_per_month": 650000, "location": "Berkoh",
                "address": "Jl. Sunan Kalijaga, Berkoh, Purwokerto",
                "latitude": -7.4365, "longitude": 109.2355,
                "facilities": ["WiFi", "Kamar Mandi Dalam", "Kasur", "Lemari", "Parkir Motor"],
                "gender": "putri", "contact": "-", "available_rooms": 6
            },
        }

        if not KOST_PATH.exists():
            print(f"  [ERROR] Kost path not found: {KOST_PATH}")
        else:
            for folder in sorted(KOST_PATH.iterdir()):
                if not folder.is_dir() or folder.name.startswith('__MACOSX') or folder.name.startswith('.'):
                    continue

                folder_name = folder.name.strip()
                print(f"  Processing: {folder_name}")

                info = kost_data.get(folder_name) or kost_data.get(folder_name.title())
                if not info:
                    info = {
                        "description": f"Kost {folder_name.title()} di Purwokerto",
                        "price_per_month": 700000, "location": "Purwokerto",
                        "address": "Purwokerto", "latitude": -7.42, "longitude": 109.24,
                        "facilities": ["WiFi", "Kamar Mandi Dalam"],
                        "gender": "campur", "contact": "-", "available_rooms": 3
                    }

                images = []
                for item_file in sorted(folder.iterdir()):
                    if not item_file.is_file() or item_file.name.startswith('.'):
                        continue
                    if item_file.suffix.lower() == '.docx':
                        continue
                    if is_image_file(item_file):
                        img_b64 = file_to_base64(item_file)
                        if img_b64:
                            images.append(img_b64)
                            print(f"    - {item_file.name}")

                if not images:
                    print(f"    [SKIP] No images")
                    continue

                kost_name = info.get("name", folder_name.title())
                await conn.execute(
                    """INSERT INTO kost (id, name, description, price_per_month, location, address,
                       latitude, longitude, images, facilities, gender, contact, rating, available_rooms)
                       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11,$12,$13,$14)""",
                    str(uuid.uuid4()), kost_name, info["description"],
                    info["price_per_month"], info["location"], info["address"],
                    info["latitude"], info["longitude"],
                    json.dumps(images[:10]),
                    json.dumps(info["facilities"]),
                    info["gender"], info["contact"],
                    round(4.2 + (hash(kost_name) % 8) / 10, 1),
                    info["available_rooms"]
                )
                print(f"    => Saved {len(images)} images")

    await pool.close()
    print("\n=== SEEDING COMPLETE ===")


if __name__ == "__main__":
    asyncio.run(seed_all())
