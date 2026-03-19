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

def setup_traffic_infrastructure(supabase: Client):
    """
    БЛОК 1. ИНИЦИАЛИЗАЦИЯ ИНФРАСТРУКТУРЫ
    Запускается 1 раз для создания камеры, светофора и их отображения на карте.
    """
    logging.info("=== БЛОК 1: Инициализация инфраструктуры трафика ===")
    
    # 1. Создаем asset типа traffic_camera
    cam_res = supabase.table("assets").insert({"type": "traffic_camera", "status": "active"}).execute()
    camera_id = cam_res.data[0]['id']
    logging.info(f"Asset (Traffic Camera) создан: {camera_id}")

    # 2. Создаем asset типа traffic_light
    light_res = supabase.table("assets").insert({"type": "traffic_light", "status": "active"}).execute()
    light_id = light_res.data[0]['id']
    logging.info(f"Asset (Traffic Light) создан: {light_id}")

    # 3. Добавляем ДОРОГУ (Линию) в Map Features
    road_map_id = str(uuid.uuid4())
    road_data = {
        "id": road_map_id,
        "type": "LineString",
        "geometry": {
            "type": "LineString",
            "coordinates": [[77.1090, 43.6730], [77.1105, 43.6731]]
        },
        "color": "green",
        "asset_id": camera_id
    }
    supabase.table("Map Features").insert(road_data).execute()
    logging.info(f"Дорога (LineString) добавлена на карту. Map Feature ID: {road_map_id}")

    # 4. Добавляем СВЕТОФОР (Точку) в Map Features в конце дороги
    point_map_id = str(uuid.uuid4())
    light_data = {
        "id": point_map_id,
        "type": "Point",
        "geometry": {
            "type": "Point",
            "coordinates": [77.1105, 43.6731]
        },
        "asset_id": light_id
    }
    supabase.table("Map Features").insert(light_data).execute()
    logging.info(f"Точка светофора (Point) добавлена на карту. Map Feature ID: {point_map_id}")
    
    return camera_id, light_id, road_map_id

async def run_traffic_loop(supabase: Client, camera_id: str, light_id: str, road_map_id: str):
    """
    БЛОК 2. АНАЛИЗАТОР ТРАФИКА (Rule Engine)
    Бесконечный цикл каждые 3 секунды. Генерирует наблюдения и адаптирует светофор.
    """
    logging.info("=== БЛОК 2: Запуск Анализатора Трафика (Интервал 3с) ===")
    
    while True:
        try:
            # Генерация случайного car_count от 10 до 100
            car_count = random.randint(10, 100)
            logging.info(f"--- Новый такт --- [car_count: {car_count}]")
            
            # Отправка observation для камеры
            cam_obs = {
                "asset_id": camera_id,
                "payload": {"car_count": car_count}
            }
            supabase.table("observations").insert(cam_obs).execute()

            # ЛОГИКА ПРИНЯТИЯ РЕШЕНИЙ
            if car_count < 50:
                # Пробки нет
                logging.info(f"Трафик в норме (car_count < 50).")
                
                # 1. UPDATE Map Features (дорога зеленая)
                supabase.table("Map Features").update({"color": "green"}).eq("id", road_map_id).execute()
                logging.info("Road updated to GREEN")
                
                # 2. Observation для светофора
                light_obs = {
                    "asset_id": light_id,
                    "payload": {"phase": "green", "timer": 60}
                }
                supabase.table("observations").insert(light_obs).execute()
                logging.info("Traffic light is GREEN")
                
            else:
                # Пробка обнаружена!
                logging.warning(f"ПРОБКА ОБНАРУЖЕНА! (car_count >= 50). Adaptive Control Activated.")
                
                # 1. UPDATE Map Features (дорога красная)
                supabase.table("Map Features").update({"color": "red"}).eq("id", road_map_id).execute()
                logging.info("Road updated to RED")
                
                # 2. Observation для светофора (увеличенный таймер)
                light_obs = {
                    "asset_id": light_id,
                    "payload": {"phase": "red", "timer": 120, "reason": "adaptive_control"}
                }
                supabase.table("observations").insert(light_obs).execute()
                logging.info("Traffic light is RED")
                
                # 3. Создаем ИНЦИДЕНТ в таблице events
                event_data = {
                    "severity": 3,
                    "event_type": "traffic_jam",
                    "asset_id": camera_id,
                    "description": f"Адаптивный контроль запущен. Машин в потоке: {car_count}"
                }
                supabase.table("events").insert(event_data).execute()
                logging.warning("Event created: type='traffic_jam', severity=3")
                
        except Exception as e:
            logging.error(f"Ошибка в цикле трафика: {e} (Перезапуск через 3 сек...)")
            
        await asyncio.sleep(3)

async def main():
    try:
        logging.info("Подключение к Supabase...")
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Выполняем Блок 1
        camera_id, light_id, road_map_id = setup_traffic_infrastructure(supabase)
        
        # Выполняем Блок 2
        await run_traffic_loop(supabase, camera_id, light_id, road_map_id)
        
    except Exception as e:
        logging.critical(f"Критическая ошибка: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("\nСимуляция трафика остановлена.")
