import uuid
import random
import asyncio
import logging
from supabase import create_client, Client

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s | %(levelname)s | %(message)s')

SUPABASE_URL = 'https://lhrmcxdzflclqpiykoeb.supabase.co'
SUPABASE_KEY = 'sb_publishable_RzNSGBsRw82CiiLcFkJJhg_gcEJLRvy'

def setup_intersection(supabase: Client):
    """
    БЛОК 1. ИНИЦИАЛИЗАЦИЯ ИНФРАСТРУКТУРЫ: Строим полноценный перекресток
    """
    logging.info("=== БЛОК 1: Создание перекрестка ===")
    
    # 1. Ассеты: 2 камеры (для каждой дороги) и 1 светофор
    cam_ns = supabase.table("assets").insert({"type": "traffic_camera", "status": "active"}).execute().data[0]['id']
    cam_ew = supabase.table("assets").insert({"type": "traffic_camera", "status": "active"}).execute().data[0]['id']
    t_light = supabase.table("assets").insert({"type": "traffic_light", "status": "active"}).execute().data[0]['id']
    
    # 2. Дорога Север-Юг (Вертикальная линия)
    road_ns_id = str(uuid.uuid4())
    supabase.table("Map Features").insert({
        "id": road_ns_id, # Использовать ранее созданный UUID
        "type": "LineString",
        "geometry": {
            "type": "LineString",
            # Вертикально пересекает 43.6730
            "coordinates": [[77.1100, 43.6740], [77.1100, 43.6720]] 
        },
        "color": "green",
        "title": "Улица Север-Юг",
        "asset_id": cam_ns
    }).execute()
    
    # 3. Дорога Запад-Восток (Горизонтальная линия)
    road_ew_id = str(uuid.uuid4())
    supabase.table("Map Features").insert({
        "id": road_ew_id, # Создаем UUID для фичи
        "type": "LineString",
        "geometry": {
            "type": "LineString",
            # Горизонтально пересекает 77.1100
            "coordinates": [[77.1090, 43.6730], [77.1110, 43.6730]]
        },
        "color": "red",
        "title": "Улица Запад-Восток",
        "asset_id": cam_ew
    }).execute()
    
    # 4. Светофор в точном центре перекрестка
    light_map_id = str(uuid.uuid4())
    supabase.table("Map Features").insert({
        "id": light_map_id,
        "type": "Point",
        "geometry": {
            "type": "Point",
            "coordinates": [77.1100, 43.6730] # Точка пересечения двух дорог
        },
        "color": "yellow", # Желтый маркер светофора
        "title": "Умный перекресток",
        "asset_id": t_light
    }).execute()
    
    logging.info("Перекресток и 3 ассета успешно загружены на карту!")
    return cam_ns, cam_ew, t_light, road_ns_id, road_ew_id

async def run_traffic_loop(supabase: Client, cam_ns, cam_ew, t_light, road_ns_id, road_ew_id):
    """
    БЛОК 2. АНАЛИЗАТОР ТРАФИКА
    Пишет показания в observations каждые 4 секунды.
    Меняет цвет дорог в Map Features напрямую.
    В events пишет только если пробка держится >= 2 шагов подряд.
    """
    logging.info("=== БЛОК 2: Запуск умного светофора ===")
    
    JAM_THRESHOLD = 50 # Если машин больше - считаем затор
    jam_counter = {"ns": 0, "ew": 0} # Счетчики продолжительности пробок
    
    while True:
        try:
            # Генерация машин на двух направлениях
            cars_ns = random.randint(10, 80)
            cars_ew = random.randint(10, 80)
            
            # 1. ОБЕ КАМЕРЫ ПИШУТ ПОКАЗАНИЯ В OBSERVATIONS (Как обычные сенсоры)
            supabase.table("observations").insert([
                {"asset_id": cam_ns, "payload": {"car_count": cars_ns, "direction": "North-South"}},
                {"asset_id": cam_ew, "payload": {"car_count": cars_ew, "direction": "East-West"}}
            ]).execute()

            # 2. ЛОГИКА АДАПТИВНОГО СВЕТОФОРА (Динамические цвета)
            # У кого больше машин, тому даем зеленый свет, другому - красный
            if cars_ns >= cars_ew:
                phase_ns, phase_ew = "green", "red"
                # Обновляем напрямую цвета в базе
                supabase.table("Map Features").update({"color": "green"}).eq("id", road_ns_id).execute()
                supabase.table("Map Features").update({"color": "red"}).eq("id", road_ew_id).execute()
            else:
                phase_ns, phase_ew = "red", "green"
                supabase.table("Map Features").update({"color": "red"}).eq("id", road_ns_id).execute()
                supabase.table("Map Features").update({"color": "green"}).eq("id", road_ew_id).execute()
                
            # 3. САМ СВЕТОФОР ПИШЕТ В СВОИ OBSERVATIONS (Его текущая фаза)
            supabase.table("observations").insert({
                "asset_id": t_light,
                "payload": {"phase_ns": phase_ns, "phase_ew": phase_ew}
            }).execute()
            
            # 4. ЛОГИКА ИНЦИДЕНТОВ (Только если пробка держится несколько шагов)
            # Для дороги Север-Юг
            if cars_ns >= JAM_THRESHOLD:
                jam_counter["ns"] += 1
                if jam_counter["ns"] == 2: # Пробка второй такт подряд
                    supabase.table("events").insert({
                        "severity": 3, "event_type": "traffic_jam", "asset_id": cam_ns,
                        "description": f"Продолжительный затор (С-Ю). Машин в потоке: {cars_ns}"
                    }).execute()
                    logging.warning("Сгенерирован EVENT (Пробка Север-Юг)!")
            else:
                jam_counter["ns"] = 0 # Сброс, пробка рассосалась
                
            # Для дороги Запад-Восток
            if cars_ew >= JAM_THRESHOLD:
                jam_counter["ew"] += 1
                if jam_counter["ew"] == 2: # Пробка второй такт подряд
                    supabase.table("events").insert({
                        "severity": 3, "event_type": "traffic_jam", "asset_id": cam_ew,
                        "description": f"Продолжительный затор (З-В). Машин в потоке: {cars_ew}"
                    }).execute()
                    logging.warning("Сгенерирован EVENT (Пробка Запад-Восток)!")
            else:
                jam_counter["ew"] = 0 # Сброс
                
            logging.info(f"Такт [NS: {cars_ns} машин -> {phase_ns.upper()}] | [EW: {cars_ew} машин -> {phase_ew.upper()}]")
            
        except Exception as e:
            logging.error(f"Ошибка в цикле трафика: {e} (Перезапуск через 4 сек...)")
            
        await asyncio.sleep(4)

async def main():
    try:
        logging.info("Подключение к Supabase...")
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Блок 1
        cam_ns, cam_ew, t_light, road_ns_id, road_ew_id = setup_intersection(supabase)
        
        # Блок 2
        await run_traffic_loop(supabase, cam_ns, cam_ew, t_light, road_ns_id, road_ew_id)
        
    except Exception as e:
        logging.critical(f"Критическая ошибка: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("\nСимуляция трафика остановлена.")
