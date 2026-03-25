import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

export type AppLanguage = 'en' | 'ru' | 'kk'

type I18nContextValue = {
  language: AppLanguage
  setLanguage: (next: AppLanguage) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)
const STORAGE_KEY = 'app.language'

const uiDictionary: Record<AppLanguage, Record<string, string>> = {
  en: {},
  ru: {
    Profile: 'Профиль',
    Settings: 'Настройки',
    'Log out': 'Выйти',
    'Sign Out': 'Выйти',
    Retry: 'Повторить',
    Save: 'Сохранить',
    Cancel: 'Отмена',
    'Save changes': 'Сохранить изменения',
    'Report to Akimat': 'Отправить в Акимат',
    Objects: 'Объекты',
    'Add New Object': 'Добавить объект',
    Requests: 'Обращения',
    Cameras: 'Камеры',
    Facilities: 'Объекты',
    Statistics: 'Статистика',
    Friends: 'Друзья',
    Events: 'События',
    Buses: 'Автобусы',
    Ramps: 'Пандусы',
    Scooters: 'Самокаты',
    Select: 'Выбор',
    Point: 'Точка',
    Line: 'Линия',
    Polygon: 'Полигон',
    Delete: 'Удалить',
    Close: 'Закрыть',
    Description: 'Описание',
    Tags: 'Теги',
    Properties: 'Свойства',
    Levels: 'Этажность',
    Type: 'Тип',
    Roof: 'Крыша',
    'Min Height': 'Мин. высота',
    Building: 'Здание',
    Feature: 'Объект',
    Color: 'Цвет',
    Icon: 'Иконка',
    Observations: 'Наблюдения',
    'Load observations': 'Загрузить наблюдения',
    'Add observation': 'Добавить наблюдение',
    'Developer Portal': 'Портал застройщика',
    'City Overview Map': 'Карта города',
    'City Events': 'Городские события',
    'Upcoming events in Alatau': 'Предстоящие события в Алатау',
    'City events': 'События города',
    'City Administration Dashboard': 'Панель управления городом',
    'Smart City Control Center': 'Центр управления умным городом',
    Akimat: 'Акимат',
    'Akimat Settings': 'Настройки Акимата',
    'Settings are intentionally left empty for now. Theme switching can be added later.':
      'Настройки пока пусты. Переключение темы можно добавить позже.',
    'Requests Overview': 'Обзор обращений',
    Complaints: 'Жалобы',
    Suggestions: 'Предложения',
    Letters: 'Письма',
    'Surveillance Status': 'Статус наблюдения',
    Online: 'Онлайн',
    Offline: 'Оффлайн',
    Maintenance: 'Обслуживание',
    'Reports Received Today': 'Отчеты, полученные сегодня',
    'From Developers': 'От застройщиков',
    'From Utilities': 'От ЖКХ',
    'From Industrialists': 'От промышленников',
    'Recent Activity': 'Последняя активность',
    Buildings: 'Здания',
    Problems: 'Проблемы',
    Construction: 'Строительство',
    'Resource Management Dashboard': 'Панель управления ресурсами',
    'Profile Settings': 'Настройки профиля',
    'Alatau Utilities': 'Алатау ЖКХ',
    'Monthly Consumption': 'Месячное потребление',
    'District Overview': 'Обзор района',
    'Peak Hours': 'Пиковые часы',
    'Highest consumption period': 'Период наибольшего потребления',
    'Active Connections': 'Активные подключения',
    'Registered meters': 'Зарегистрированные счетчики',
    'Avg. Daily Usage': 'Среднее дневное потребление',
    'Per household': 'На домохозяйство',
    'Utility Report for Akimat': 'Отчет ЖКХ для Акимата',
    'Submit a utility incident or operational report':
      'Отправьте отчет об инциденте или операционной проблеме',
    'Choose the target asset and describe what needs municipal review.':
      'Выберите целевой актив и опишите, что нужно проверить муниципалитету.',
    Resource: 'Ресурс',
    Target: 'Цель',
    'Select utility asset': 'Выберите коммунальный актив',
    Title: 'Заголовок',
    'Example: Water pressure instability': 'Пример: нестабильное давление воды',
    Priority: 'Приоритет',
    Low: 'Низкий',
    Medium: 'Средний',
    High: 'Высокий',
    'Describe the issue, impact, and required response.':
      'Опишите проблему, последствия и требуемые действия.',
    'Submit Report': 'Отправить отчет',
    Export: 'Экспорт',
    'Report sent to Akimat.': 'Отчет отправлен в Акимат.',
    'Click on the map to choose the project location':
      'Нажмите на карту, чтобы выбрать местоположение проекта',
    'Construction Object': 'Строительный объект',
    'Report Title': 'Название отчета',
    'Select object': 'Выберите объект',
    'Example: Permit review delay': 'Пример: задержка рассмотрения разрешения',
    'Where do you want to go?': 'Куда вы хотите поехать?',
    'Start Navigation': 'Начать навигацию',
    'No data': 'Нет данных',
    'Developer Profile': 'Профиль застройщика',
    'Developer Account': 'Аккаунт застройщика',
    'Company Name': 'Название компании',
    'Contact Person': 'Контактное лицо',
    Email: 'Эл. почта',
    Phone: 'Телефон',
    Address: 'Адрес',
    'License Number': 'Номер лицензии',
    'About Company': 'О компании',
    'Active Projects': 'Активные проекты',
    Completed: 'Завершено',
    'Avg. Progress': 'Средний прогресс',
    'Edit Profile': 'Редактировать профиль',
    'Saving...': 'Сохранение...',
    'Uploading avatar...': 'Загрузка аватара...',
    'Avatar uploaded. Save the profile to persist the change.':
      'Аватар загружен. Сохраните профиль, чтобы применить изменение.',
    'Profile saved successfully.': 'Профиль успешно сохранен.',
    'Profile saved. Check your inbox if email confirmation is required.':
      'Профиль сохранен. Проверьте почту, если требуется подтверждение email.',
    'New Construction Object': 'Новый строительный объект',
    'Create a new tracked project in the developer registry.':
      'Создайте новый проект в реестре застройщика.',
    Details: 'Детали',
    Reports: 'Отчеты',
    'Object Name': 'Название объекта',
    'Object Type': 'Тип объекта',
    'Contact Phone': 'Контактный телефон',
    Status: 'Статус',
    Planning: 'Планирование',
    'In Progress': 'В процессе',
    Delayed: 'Задержан',
    Deadline: 'Срок',
    Progress: 'Прогресс',
    'Developer Name': 'Имя застройщика',
    'Describe the construction project...': 'Опишите строительный проект...',
    'No related reports yet': 'Связанных отчетов пока нет',
    'Reports to Akimat will appear here after they are submitted for this object.':
      'Отчеты для Акимата появятся здесь после отправки по этому объекту.',
    'Save Changes': 'Сохранить изменения',
    'My Construction Objects': 'Мои строительные объекты',
    'Search objects...': 'Поиск объектов...',
    'No construction objects yet': 'Строительных объектов пока нет',
    'Add your first tracked object to start using the developer dashboard.':
      'Добавьте первый объект, чтобы начать работу в панели застройщика.',
    'Deadline:': 'Срок:',
    'Click to add banner image': 'Нажмите, чтобы добавить баннер',
    Remove: 'Удалить',
    'Enter title...': 'Введите название...',
    'Name this feature...': 'Назовите этот объект...',
    None: 'Нет',
    Custom: 'Пользовательская',
    'Traffic Light': 'Светофор',
    Red: 'Красный',
    Yellow: 'Желтый',
    Green: 'Зеленый',
    'Switches are synced in real time across devices.':
      'Переключения синхронизируются между устройствами в реальном времени.',
    'Asset ID': 'ID актива',
    'UUID of asset': 'UUID актива',
    'Optional. UUID format example: 123e4567-e89b-12d3-a456-426614174000':
      'Необязательно. Пример формата UUID: 123e4567-e89b-12d3-a456-426614174000',
    'Add a description...': 'Добавьте описание...',
    'Type a tag and press Enter...': 'Введите тег и нажмите Enter...',
    Points: 'Точки',
    Fire: 'Огонь',
    Water: 'Вода',
    Electricity: 'Электричество',
  },
  kk: {
    Profile: 'Профиль',
    Settings: 'Баптаулар',
    'Log out': 'Шығу',
    'Sign Out': 'Шығу',
    Retry: 'Қайталау',
    Save: 'Сақтау',
    Cancel: 'Бас тарту',
    'Save changes': 'Өзгерістерді сақтау',
    'Report to Akimat': 'Әкімдікке жіберу',
    Objects: 'Нысандар',
    'Add New Object': 'Жаңа нысан қосу',
    Requests: 'Өтініштер',
    Cameras: 'Камералар',
    Facilities: 'Нысандар',
    Statistics: 'Статистика',
    Friends: 'Достар',
    Events: 'Оқиғалар',
    Buses: 'Автобустар',
    Ramps: 'Пандустар',
    Scooters: 'Самокаттар',
    Select: 'Таңдау',
    Point: 'Нүкте',
    Line: 'Сызық',
    Polygon: 'Полигон',
    Delete: 'Жою',
    Close: 'Жабу',
    Description: 'Сипаттама',
    Tags: 'Тегтер',
    Properties: 'Қасиеттер',
    Levels: 'Қабаттар',
    Type: 'Түрі',
    Roof: 'Шатыр',
    'Min Height': 'Мин. биіктік',
    Building: 'Ғимарат',
    Feature: 'Нысан',
    Color: 'Түс',
    Icon: 'Белгіше',
    Observations: 'Бақылаулар',
    'Load observations': 'Бақылауларды жүктеу',
    'Add observation': 'Бақылау қосу',
    'Developer Portal': 'Құрылысшы порталы',
    'City Overview Map': 'Қала картасы',
    'City Events': 'Қала оқиғалары',
    'Upcoming events in Alatau': 'Алатаудағы алдағы оқиғалар',
    'City events': 'Қала оқиғалары',
    'City Administration Dashboard': 'Қала әкімшілігі панелі',
    'Smart City Control Center': 'Ақылды қала басқару орталығы',
    Akimat: 'Әкімдік',
    'Akimat Settings': 'Әкімдік баптаулары',
    'Settings are intentionally left empty for now. Theme switching can be added later.':
      'Баптаулар әзірге бос. Тақырыпты ауыстыру кейін қосылады.',
    'Requests Overview': 'Өтініштерге шолу',
    Complaints: 'Шағымдар',
    Suggestions: 'Ұсыныстар',
    Letters: 'Хаттар',
    'Surveillance Status': 'Бақылау күйі',
    Online: 'Желіде',
    Offline: 'Желіде емес',
    Maintenance: 'Қызмет көрсету',
    'Reports Received Today': 'Бүгін алынған есептер',
    'From Developers': 'Құрылысшылардан',
    'From Utilities': 'Коммуналдық қызметтен',
    'From Industrialists': 'Өнеркәсіп өкілдерінен',
    'Recent Activity': 'Соңғы белсенділік',
    Buildings: 'Ғимараттар',
    Problems: 'Мәселелер',
    Construction: 'Құрылыс',
    'Resource Management Dashboard': 'Ресурстарды басқару панелі',
    'Profile Settings': 'Профиль баптаулары',
    'Alatau Utilities': 'Алатау коммуналдық қызметі',
    'Monthly Consumption': 'Айлық тұтыну',
    'District Overview': 'Ауданға шолу',
    'Peak Hours': 'Шың сағаттар',
    'Highest consumption period': 'Ең жоғары тұтыну кезеңі',
    'Active Connections': 'Белсенді қосылымдар',
    'Registered meters': 'Тіркелген есептегіштер',
    'Avg. Daily Usage': 'Орташа күндік тұтыну',
    'Per household': 'Бір үй шаруашылығына',
    'Utility Report for Akimat': 'Әкімдікке коммуналдық есеп',
    'Submit a utility incident or operational report':
      'Коммуналдық оқиға не операциялық есеп жіберіңіз',
    'Choose the target asset and describe what needs municipal review.':
      'Нысан активін таңдап, муниципалды тексеруге не қажет екенін сипаттаңыз.',
    Resource: 'Ресурс',
    Target: 'Нысана',
    'Select utility asset': 'Коммуналдық активті таңдаңыз',
    Title: 'Тақырып',
    'Example: Water pressure instability': 'Мысал: су қысымының тұрақсыздығы',
    Priority: 'Басымдық',
    Low: 'Төмен',
    Medium: 'Орташа',
    High: 'Жоғары',
    'Describe the issue, impact, and required response.':
      'Мәселені, әсерін және қажет әрекетті сипаттаңыз.',
    'Submit Report': 'Есепті жіберу',
    Export: 'Экспорт',
    'Report sent to Akimat.': 'Есеп әкімдікке жіберілді.',
    'Click on the map to choose the project location':
      'Жоба орнын таңдау үшін картадан басыңыз',
    'Construction Object': 'Құрылыс нысаны',
    'Report Title': 'Есеп атауы',
    'Select object': 'Нысанды таңдаңыз',
    'Example: Permit review delay': 'Мысал: рұқсатты қарау кешігуі',
    'Where do you want to go?': 'Қайда барғыңыз келеді?',
    'Start Navigation': 'Навигацияны бастау',
    'No data': 'Дерек жоқ',
    'Developer Profile': 'Құрылысшы профилі',
    'Developer Account': 'Құрылысшы аккаунты',
    'Company Name': 'Компания атауы',
    'Contact Person': 'Байланыс тұлғасы',
    Email: 'Эл. пошта',
    Phone: 'Телефон',
    Address: 'Мекенжай',
    'License Number': 'Лицензия нөмірі',
    'About Company': 'Компания туралы',
    'Active Projects': 'Белсенді жобалар',
    Completed: 'Аяқталды',
    'Avg. Progress': 'Орташа прогресс',
    'Edit Profile': 'Профильді өңдеу',
    'Saving...': 'Сақталуда...',
    'Uploading avatar...': 'Аватар жүктелуде...',
    'Avatar uploaded. Save the profile to persist the change.':
      'Аватар жүктелді. Өзгерісті сақтау үшін профильді сақтаңыз.',
    'Profile saved successfully.': 'Профиль сәтті сақталды.',
    'Profile saved. Check your inbox if email confirmation is required.':
      'Профиль сақталды. Email растау қажет болса, кіріс жәшігін тексеріңіз.',
    'New Construction Object': 'Жаңа құрылыс нысаны',
    'Create a new tracked project in the developer registry.':
      'Құрылысшы тізілімінде жаңа бақыланатын жоба жасаңыз.',
    Details: 'Деректер',
    Reports: 'Есептер',
    'Object Name': 'Нысан атауы',
    'Object Type': 'Нысан түрі',
    'Contact Phone': 'Байланыс телефоны',
    Status: 'Күйі',
    Planning: 'Жоспарлау',
    'In Progress': 'Орындалуда',
    Delayed: 'Кешіктірілген',
    Deadline: 'Мерзімі',
    Progress: 'Орындалу барысы',
    'Developer Name': 'Құрылысшы атауы',
    'Describe the construction project...': 'Құрылыс жобасын сипаттаңыз...',
    'No related reports yet': 'Қатысты есептер әзірге жоқ',
    'Reports to Akimat will appear here after they are submitted for this object.':
      'Әкімдікке арналған есептер осы нысан бойынша жіберілгеннен кейін осында көрінеді.',
    'Save Changes': 'Өзгерістерді сақтау',
    'My Construction Objects': 'Менің құрылыс нысандарым',
    'Search objects...': 'Нысандарды іздеу...',
    'No construction objects yet': 'Құрылыс нысандары әлі жоқ',
    'Add your first tracked object to start using the developer dashboard.':
      'Құрылысшы панелін қолдануды бастау үшін алғашқы нысанды қосыңыз.',
    'Deadline:': 'Мерзімі:',
    'Click to add banner image': 'Баннер суретін қосу үшін басыңыз',
    Remove: 'Өшіру',
    'Enter title...': 'Атауын енгізіңіз...',
    'Name this feature...': 'Бұл нысанды атаңыз...',
    None: 'Жоқ',
    Custom: 'Теңшелетін',
    'Traffic Light': 'Бағдаршам',
    Red: 'Қызыл',
    Yellow: 'Сары',
    Green: 'Жасыл',
    'Switches are synced in real time across devices.':
      'Ауыстырулар құрылғылар арасында нақты уақытта синхрондалады.',
    'Asset ID': 'Актив ID',
    'UUID of asset': 'Активтің UUID-і',
    'Optional. UUID format example: 123e4567-e89b-12d3-a456-426614174000':
      'Міндетті емес. UUID үлгісі: 123e4567-e89b-12d3-a456-426614174000',
    'Add a description...': 'Сипаттама қосыңыз...',
    'Type a tag and press Enter...': 'Тег енгізіп, Enter басыңыз...',
    Points: 'Нүктелер',
    Fire: 'Өрт',
    Water: 'Су',
    Electricity: 'Электр қуаты',
  },
}

const seenOriginalText = new WeakMap<Text, string>()

function translateValue(value: string, language: AppLanguage) {
  if (!value || language === 'en') return value
  return uiDictionary[language][value] ?? value
}

function translateTree(root: ParentNode, language: AppLanguage) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()

  while (node) {
    const textNode = node as Text
    const raw = seenOriginalText.get(textNode) ?? textNode.nodeValue ?? ''
    if (!seenOriginalText.has(textNode)) {
      seenOriginalText.set(textNode, raw)
    }
    const normalized = raw.trim()
    if (normalized && uiDictionary.en !== undefined) {
      const translated = translateValue(normalized, language)
      if (translated !== normalized) {
        textNode.nodeValue = raw.replace(normalized, translated)
      } else {
        textNode.nodeValue = raw
      }
    }
    node = walker.nextNode()
  }

  const elements = root.querySelectorAll<HTMLElement>('[placeholder],[title],[aria-label]')
  elements.forEach((el) => {
    const placeholder = el.getAttribute('placeholder')
    if (placeholder) {
      const original = el.dataset.i18nPlaceholder ?? placeholder
      el.dataset.i18nPlaceholder = original
      el.setAttribute('placeholder', translateValue(original, language))
    }
    const title = el.getAttribute('title')
    if (title) {
      const original = el.dataset.i18nTitle ?? title
      el.dataset.i18nTitle = original
      el.setAttribute('title', translateValue(original, language))
    }
    const ariaLabel = el.getAttribute('aria-label')
    if (ariaLabel) {
      const original = el.dataset.i18nAriaLabel ?? ariaLabel
      el.dataset.i18nAriaLabel = original
      el.setAttribute('aria-label', translateValue(original, language))
    }
  })
}

export function I18nProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved === 'ru' || saved === 'kk' ? saved : 'en'
  })

  const setLanguage = (next: AppLanguage) => {
    setLanguageState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }

  useEffect(() => {
    document.documentElement.lang = language
    translateTree(document.body, language)

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((added) => {
          if (added instanceof HTMLElement) {
            translateTree(added, language)
          } else if (added instanceof Text && added.parentElement) {
            translateTree(added.parentElement, language)
          }
        })
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    return () => observer.disconnect()
  }, [language])

  const value = useMemo<I18nContextValue>(
    () => ({ language, setLanguage }),
    [language],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider')
  }
  return context
}
