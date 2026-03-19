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
    БЛОК 1. ИНИЦИАЛИЗАЦИЯ ИНФРАСТРУКТУРЫ: Строим полноценный перекресток (4 светофора)
    """
    logging.info("=== БЛОК 1: Создание перекрестка (4 сигнала) ===")
    
    # 1. Ассеты: 2 камеры и 4 светофора
    cam_ns = supabase.table("assets").insert({"type": "traffic_camera", "status": "active"}).execute().data[0]['id']
    cam_ew = supabase.table("assets").insert({"type": "traffic_camera", "status": "active"}).execute().data[0]['id']
    
    # Создаем 4 актива для светофоров
    light_n = supabase.table("assets").insert({"type": "traffic_light", "status": "active"}).execute().data[0]['id']
    light_s = supabase.table("assets").insert({"type": "traffic_light", "status": "active"}).execute().data[0]['id']
    light_e = supabase.table("assets").insert({"type": "traffic_light", "status": "active"}).execute().data[0]['id']
    light_w = supabase.table("assets").insert({"type": "traffic_light", "status": "active"}).execute().data[0]['id']
    
    center_lon, center_lat = 77.0227, 43.6402
    offset = 0.00015 # Небольшой отступ от центра для иконок

    # 2. Дороги (LineStrings)
    road_ns_id = str(uuid.uuid4())
    supabase.table("Map Features").insert({
        "id": road_ns_id,
        "type": "LineString",
        "geometry": {
            "type": "LineString", 
            "coordinates": [
                [77.02466908552145, 43.65513503596449],
                [77.02270926806176, 43.64023471443309],
                [77.01804993022944, 43.625010048526775]
            ]
        },
        "color": "#22c55e",
        "title": "Улица Север-Юг"
    }).execute()
    
    road_ew_id = str(uuid.uuid4())
    supabase.table("Map Features").insert({
        "id": road_ew_id,
        "type": "LineString",
        "geometry": {
            "type": "LineString", 
            "coordinates": [
                [76.99483324968236, 43.64000391298504],
                [77.017337610416, 43.6419261860548],
                [77.02265011524611, 43.64085826416448],
                [77.05150811443713, 43.63426612689389],
                [77.05150811443713, 43.63426612689389]
            ]
        },
        "color": "#ef4444",
        "title": "Улица Северо-Запад"
    }).execute()
    
    # 3. Камеры на карте (Точки) вблизи перекрестка
    supabase.table("Map Features").insert([
        {
            "id": str(uuid.uuid4()), "type": "Point", "asset_id": cam_ns,
            "geometry": {"type": "Point", "coordinates": [center_lon, center_lat + 0.0008]},
            "title": "Камера (С-Ю)", "icon": "📹"
        },
        {
            "id": str(uuid.uuid4()), "type": "Point", "asset_id": cam_ew,
            "geometry": {"type": "Point", "coordinates": [center_lon - 0.0008, center_lat + 0.0002]},
            "title": "Камера (Сев-Зап)", "icon": "📹"
        }
    ]).execute()

    # 4. СВЕТОФОРЫ: 4 точки вокруг центра пересечения
    map_light_n = str(uuid.uuid4())
    map_light_s = str(uuid.uuid4())
    map_light_e = str(uuid.uuid4())
    map_light_w = str(uuid.uuid4())

    supabase.table("Map Features").insert([
        {"id": map_light_n, "type": "Point", "asset_id": light_n, "icon": "🟡", "title": "Светофор Север", "geometry": {"type": "Point", "coordinates": [center_lon + 0.0001, center_lat + offset]}},
        {"id": map_light_s, "type": "Point", "asset_id": light_s, "icon": "🟡", "title": "Светофор Юг", "geometry": {"type": "Point", "coordinates": [center_lon - 0.0001, center_lat - offset]}},
        {"id": map_light_e, "type": "Point", "asset_id": light_e, "icon": "🟡", "title": "Светофор Восток", "geometry": {"type": "Point", "coordinates": [center_lon + offset, center_lat - 0.0001]}},
        {"id": map_light_w, "type": "Point", "asset_id": light_w, "icon": "🟡", "title": "Светофор Запад", "geometry": {"type": "Point", "coordinates": [center_lon - offset, center_lat + 0.0001]}}
    ]).execute()
    
    logging.info("Перекресток (4 светофора) успешно проинициализирован!")
    return {
        "cam_ns": cam_ns, "cam_ew": cam_ew,
        "lights_ns": [light_n, light_s], "lights_ew": [light_e, light_w],
        "map_lights_ns": [map_light_n, map_light_s], "map_lights_ew": [map_light_e, map_light_w],
        "road_ns": road_ns_id, "road_ew": road_ew_id
    }

async def run_traffic_loop(supabase: Client, config: dict):
    """
    БЛОК 2. АНАЛИЗАТОР И УПРАВЛЕНИЕ: 4 светофора с динамическими иконками 🔴🟢
    """
    logging.info("=== БЛОК 2: Запуск цикла управления перекрестком ===")
    jam_counter = {"ns": 0, "ew": 0}
    
    while True:
        try:
            cars_ns = random.randint(10, 80)
            cars_ew = random.randint(10, 80)
            
            # 1. Observations от камер
            supabase.table("observations").insert([
                {"asset_id": config["cam_ns"], "payload": {"car_count": cars_ns, "dir": "NS"}},
                {"asset_id": config["cam_ew"], "payload": {"car_count": cars_ew, "dir": "EW"}}
            ]).execute()

            # 2. АЛЬТЕРНАТИВНАЯ ЛОГИКА АДАПТАЦИИ (Через traffic_lights, чтобы обойти ошибку вебсокета)
            ns_is_green = cars_ns >= cars_ew
            
            traffic_state_ns = "green" if ns_is_green else "red"
            traffic_state_ew = "red" if ns_is_green else "green"
            
            # Собираем массив обновлений стейтов для всех точек и дорог
            upserts = [
                {"feature_id": config["road_ns"], "state": traffic_state_ns},
                {"feature_id": config["road_ew"], "state": traffic_state_ew}
            ]
            for map_id in config["map_lights_ns"]:
                upserts.append({"feature_id": map_id, "state": traffic_state_ns})
            for map_id in config["map_lights_ew"]:
                upserts.append({"feature_id": map_id, "state": traffic_state_ew})
                
            # Массовый апдейт (фронтенд сразу словит это по вебсокету traffic_lights и перекрасит карту + иконки)
            supabase.table("traffic_lights").upsert(upserts, on_conflict="feature_id").execute()
            
            # 3. Observations от самих светофоров
            light_obs = []
            for asset_id in config["lights_ns"]:
                light_obs.append({"asset_id": asset_id, "payload": {"status": "green" if ns_is_green else "red"}})
            for asset_id in config["lights_ew"]:
                light_obs.append({"asset_id": asset_id, "payload": {"status": "red" if ns_is_green else "green"}})
            supabase.table("observations").insert(light_obs).execute()

            # 4. Events (затяжная пробка)
            for key, val in [("ns", cars_ns), ("ew", cars_ew)]:
                if val >= 60:
                    jam_counter[key] += 1
                    if jam_counter[key] >= 2:
                        supabase.table("events").insert({
                            "severity": 3, "event_type": "traffic_jam",
                            "asset_id": config[f"cam_{key}"],
                            "description": f"Критический затор на {key.upper()}. Поток: {val}"
                        }).execute()
                else:
                    jam_counter[key] = 0

            logging.info(f"Update: NS [{cars_ns} c] -> {traffic_state_ns.upper()} | EW [{cars_ew} c] -> {traffic_state_ew.upper()}")
            
        except Exception as e:
            logging.error(f"Error in cycle: {e}")
            
        await asyncio.sleep(4)

async def main():
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        config = setup_intersection(supabase)
        await run_traffic_loop(supabase, config)
    except Exception as e:
        logging.critical(f"FATAL: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("\nSimulation stopped.")
