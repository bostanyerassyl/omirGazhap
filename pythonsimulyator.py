import os
import math
import uuid
import random
import asyncio
import logging
from supabase import create_client, Client

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s | %(levelname)s | %(message)s')

# Креденшналы Supabase
SUPABASE_URL = 'https://lhrmcxdzflclqpiykoeb.supabase.co'
SUPABASE_KEY = 'sb_publishable_RzNSGBsRw82CiiLcFkJJhg_gcEJLRvy'

# Базовые координаты Алатау
CENTER_LAT = 43.673943872429916
CENTER_LON = 77.10766431791033

def generate_random_point(center_lat, center_lon, radius_km=1.0):
    """Генерация случайной точки в заданном радиусе (в км) от центра."""
    earth_radius = 6371.0
    
    # Случайная дистанция и угол
    distance = random.uniform(0, radius_km)
    angle = random.uniform(0, 2 * math.pi)
    
    # Смещение координат в радианах
    lat_offset = distance * math.cos(angle) / earth_radius
    lon_offset = distance * math.sin(angle) / (earth_radius * math.cos(math.radians(center_lat)))
    
    # Новые координаты
    new_lat = center_lat + math.degrees(lat_offset)
    new_lon = center_lon + math.degrees(lon_offset)
    
    return new_lat, new_lon

def setup_infrastructure(supabase: Client):
    """
    ФАЗА 1: ИНИЦИАЛИЗАЦИЯ
    Генерирует 15 ассетов и записывает их в 'assets' и 'Map Features'.
    """
    logging.info("=== ФАЗА 1: Инициализация инфраструктуры ===")
    created_assets = []
    
    sensor_types = ['water_meter', 'electricity_meter', 'gas_meter']
    type_names = {
        'water_meter': 'Счетчик воды',
        'electricity_meter': 'Счетчик электричества',
        'gas_meter': 'Счетчик газа'
    }
    type_icons = {
        'water_meter': '💦',
        'electricity_meter': '⚡',
        'gas_meter': '🔥'
    }
    
    for i in range(1, 16):
        try:
            lat, lon = generate_random_point(CENTER_LAT, CENTER_LON, radius_km=1.0)
            sensor_type = random.choice(sensor_types)
            
            # INSERT в таблицу assets
            asset_data = {
                "type": sensor_type,
                "status": "active"
            }
            asset_res = supabase.table("assets").insert(asset_data).execute()
            
            # Извлекаем сгенерированный UUID
            asset_id = asset_res.data[0]['id']
            
            # INSERT в таблицу "Map Features"
            feature_id = str(uuid.uuid4())
            feature_data = {
                "id": feature_id,
                "type": "Point",
                "geometry": {
                    "type": "Point",
                    "coordinates": [lon, lat] # Внимание: долгота первая!
                },
                "title": f"{type_names[sensor_type]} #{i}",
                "icon": type_icons[sensor_type], # Добавляем иконку
                "asset_id": asset_id # Связываем карту и логику
            }
            supabase.table("Map Features").insert(feature_data).execute()
            
            created_assets.append({
                "id": asset_id,
                "type": sensor_type
            })
            
            logging.info(f"Создан {sensor_type} #{i} (ID: {asset_id[:8]}...) на координатах [{lon:.5f}, {lat:.5f}]")
            
        except Exception as e:
            logging.error(f"Ошибка при создании инфраструктурного объекта #{i}: {e}")
            
    logging.info(f"Фаза 1 завершена. Успешно создано {len(created_assets)} объектов.\n")
    return created_assets

async def simulate_telemetry(supabase: Client, assets):
    """
    ФАЗА 2: БЕСКОНЕЧНЫЙ ЦИКЛ ПОТРЕБЛЕНИЯ
    Каждые 2 секунды отправляет массовый INSERT телеметрии.
    """
    logging.info("=== ФАЗА 2: Запуск симулятора телеметрии (интервал 2с) ===")
    
    while True:
        observations_to_insert = []
        
        for asset in assets:
            asset_id = asset['id']
            sensor_type = asset['type']
            payload = {}
            
            if sensor_type == 'water_meter':
                flow = round(random.uniform(0.5, 2.5), 2)
                pressure = round(random.uniform(2.0, 4.0), 2)
                payload = {"flow_m3": flow, "pressure_bar": pressure}
                log_tag = "[WATER]"
                log_msg = f"{flow} m3, {pressure} bar"
                
            elif sensor_type == 'electricity_meter':
                kwh = round(random.uniform(0.1, 5.0), 2)
                voltage = round(random.uniform(210.0, 230.0), 1)
                payload = {"kwh_used": kwh, "voltage_v": voltage}
                log_tag = "[ELEC]"
                log_msg = f"{kwh} kWh, {voltage} V"
                
            elif sensor_type == 'gas_meter':
                volume = round(random.uniform(0.1, 1.5), 2)
                pressure = round(random.uniform(0.02, 0.05), 3)
                payload = {"volume_m3": volume, "pressure_bar": pressure}
                log_tag = "[GAS]"
                log_msg = f"{volume} m3, {pressure} bar"
                
            observations_to_insert.append({
                "asset_id": asset_id,
                "payload": payload
            })
            
            logging.info(f"{log_tag} Asset {asset_id[:8]}... -> {log_msg}")
            
        try:
            if observations_to_insert:
                # Массовый INSERT в observations
                supabase.table("observations").insert(observations_to_insert).execute()
                logging.info(f"-> Успешно отправлен батч из {len(observations_to_insert)} метрик в БД сервера.\n")
        except Exception as e:
            # Отлов ошибок сети (скрипт не падает)
            logging.error(f"-> ОШИБКА Supabase/Сети при отправке data-батча: {e}\n")
            
        await asyncio.sleep(2)

async def main():
    logging.info("Инициализация подключения к Supabase...")
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        logging.critical(f"Не удалось подключиться к Supabase: {e}")
        return

    # Запуск Фазы 1
    assets = setup_infrastructure(supabase)
    
    if not assets:
        logging.error("Нет созданных ассетов. Остановка симулятора.")
        return
        
    # Запуск Фазы 2
    await simulate_telemetry(supabase, assets)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("\nСимулятор остановлен пользователем.")
