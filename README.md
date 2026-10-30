# Korean House Waiter Dashboard

Адаптивная панель официанта: обучение меню, квиз, поиск блюд и общие чеки в Firestore.

## Публикация (GitHub Pages)

1. Убедитесь, что репозиторий **Public** (Settings → General → Danger Zone → Change repository visibility).
2. Откройте Settings → Pages.
3. В разделе **Build and deployment** выберите **Deploy from a branch**, ветку `main`, папку `/(root)`; нажмите Save.
4. После завершения публикации сайт обычно доступен по адресу `https://zephyr363.github.io/korean-house-waiter-dashboard/`. Это ожидаемый адрес, а не подтверждение доступности.
5. В Firebase Authentication → Settings → Authorized domains добавьте `zephyr363.github.io` при необходимости.

## Firebase: подключение общих чеков

Firebase-проект: `korean-house-dashboard`. Клиентская конфигурация уже встроена в `index.html`. Секретный администраторский ключ сайту не нужен.

1. Откройте Firebase Console → **Authentication** → Sign-in method → включите **Email/Password**.
2. В **Authentication → Users** создайте учётную запись каждого официанта (email и временный пароль). Не публикуйте пароли в репозитории.
3. Скопируйте `User UID` для каждого сотрудника.
4. В **Firestore Database → Data** создайте коллекцию `staff`. Документ для сотрудника должен иметь **Document ID = UID пользователя** и поле `active` (Boolean) со значением `true`.
5. В **Firestore Database → Rules** скопируйте правила из файла `firestore.rules` и нажмите **Publish**. Загрузка файла в GitHub НЕ применяет правила к Firebase автоматически.
6. Войдите под учётной записью официанта на сайте. Теперь активные чеки загружаются из общей коллекции `receipts`.

## Поведение и ограничения

- Только зарегистрированные и разрешённые администратором сотрудники могут читать и редактировать чеки.
- Черновик хранится на устройстве; зарегистрированные чеки — в Firestore.
- Поиск блюд и квиз остаются открытыми без регистрации.
- Стоимость каждого блюда фиксируется при добавлении в чек, а суммы пересчитываются после изменения количества или цены.
- Наличие общей базы само по себе не делает систему заменой сертифицированной кассы, фискализации или учётной системы.
- Одновременное редактирование одного чека несколькими официантами может приводить к конфликту последних записей; до использования для реальных заказов нужно добавить транзакции, историю изменений и резервное копирование.
- В Firestore есть ограничения бесплатного плана; контролируйте usage и расходы в Firebase Console.

## Исходники

- `index.html` — весь сайт с интерфейсом и подключением Firebase.
- `firestore.rules` — правила доступа для Firestore.

## Безопасность — обязательно перед работой с реальными чеками

**Firebase Web API key не является паролем или ключом администратора.** В статическом сайте он виден пользователям — это штатный способ Firebase Web SDK. Не пытайтесь спрятать его в публичном `index.html` или JavaScript; защита обеспечивается правилами Firestore, Firebase Auth, App Check и API restrictions.

**Обязательные действия в консолях:**

1. Firebase Console → Firestore Database → Rules: замените правила на текущий `firestore.rules` из репозитория и нажмите **Publish**. Коммит в GitHub не применяет правила автоматически.
2. Firebase Authentication → Sign-in method: включите только нужные методы (обычно Email/Password); аккаунты создаёт администратор в Firebase Console.
3. Firestore → Data → `staff/{uid}`: создайте `active: true` (Boolean) для каждого одобренного сотрудника. Только одному или нескольким доверенным сотрудникам добавьте `role: "admin"` (String); **только admin может удалять зарегистрированные чеки**. Обычным сотрудникам можно ставить `role: "waiter"`.
4. Google Cloud Console → APIs & Services → Credentials: найдите Browser key этого Firebase-проекта, проверьте **API restrictions** (только нужные Firebase API). Можно дополнительно рассмотреть HTTP referrer restrictions на боевой домен; тестируйте вход после изменения ограничений.
5. Firebase Console → App Check: зарегистрируйте веб-приложение с reCAPTCHA Enterprise и добавьте App Check SDK на сайт **перед** включением enforcement для Firestore. Никогда не включайте enforcement без клиентской интеграции и тестирования — иначе приложение перестанет читать чеки.
6. Не загружайте в GitHub JSON-файлы `serviceAccountKey`, приватные ключи Admin SDK, OAuth client secret, личные пароли, резервные копии чеков.
7. Для доступа сотрудников удалённо используйте `active: false` и отключайте или удаляйте учётную запись в Firebase Authentication.
8. Регулярно делайте резервное копирование Firestore. В текущем приложении официанты могут изменять позиции и суммы; для финансово значимых операций нужен защищённый backend с проверкой итогов, журналом аудита и разграничением полномочий.

**Ограничения существующей версии:** Security Rules не пересчитывают математически итог чека из вложенного массива позиций, поэтому авторизованный сотрудник с доступом на редактирование технически может отправить искажённые данные вне интерфейса. Используйте этот продукт как учебный/операционный прототип, не как фискальную систему.

## GitHub Actions CI/CD — конфигурация Firebase без значений в исходном коде

С октября 2026 конфигурация Firebase **не хранится в актуальном `index.html`**. Файл `firebase-config.js` генерируется во время GitHub Actions deploy из секрета. В git находятся только шаблон сайта, скрипт и workflow.

### 1. Добавьте Actions secret

Repository → **Settings → Secrets and variables → Actions → New repository secret**

Name: `FIREBASE_CONFIG_JSON`

Value: валидный JSON-объект Firebase Web App configuration (только содержимое `{ ... }`, без `const firebaseConfig =`, импортов и комментариев). Поля: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`, при наличии `measurementId`.

### 2. Включите GitHub Actions для GitHub Pages

Repository → **Settings → Pages → Build and deployment → Source → GitHub Actions**.

После сохранения запустите workflow **Actions → Deploy Korean House to GitHub Pages → Run workflow**. Каждый push в `main` тоже вызывает деплой.

### 3. Что можно и нельзя скрыть

GitHub Actions Secret не попадёт в коммиты исходного кода, однако готовый `firebase-config.js` будет **публичным** в GitHub Pages, поскольку браузер должен получить эту конфигурацию. Это штатный механизм Firebase Web SDK, а не хранение закрытого серверного ключа. Правила безопасности Firestore и Firebase Auth обязательны. Старые версии файла с Firebase Web API key остаются в истории GitHub; это не позволяет сделать ключ секретным. Проверьте API restrictions, а при необходимости создайте новый ограниченный Web API key.

**Не храните настоящие секреты** (Firebase Admin SDK service account JSON, приватные ключи, пароли, токены с доступом на запись) в таком файле — их нельзя отдавать браузеру. Для серверных секретов требуется backend (Cloud Functions/Cloud Run) и Secret Manager.
