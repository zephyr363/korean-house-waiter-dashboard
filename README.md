# Korean House Waiter Dashboard

Адаптивная панель официанта: обучение меню, квиз, поиск блюд и общие чеки в Firestore.

## Публикация (GitHub Pages)

1. Убедитесь, что репозиторий **Public** (Settings → General → Danger Zone → Change repository visibility).
2. Откройте Settings → Pages.
3. В разделе **Build and deployment** выберите **GitHub Actions**; сборку выполняет `.github/workflows/deploy-pages.yml`.
4. После завершения публикации сайт обычно доступен по адресу `https://zephyr363.github.io/korean-house-waiter-dashboard/`. Это ожидаемый адрес, а не подтверждение доступности.
5. В Firebase Authentication → Settings → Authorized domains добавьте `zephyr363.github.io` при необходимости.

## Firebase: подключение общих чеков

Firebase-проект: `korean-house-dashboard`. Клиентская конфигурация подставляется GitHub Actions при сборке и не хранится в текущем `index.html`. Секретный администраторский ключ сайту не нужен.

1. Откройте Firebase Console → **Authentication** → Sign-in method → включите **Email/Password**.
2. В **Authentication → Users** создайте учётную запись каждого официанта (email и временный пароль). Не публикуйте пароли в репозитории.
3. Скопируйте `User UID` для каждого сотрудника.
4. В **Firestore Database → Data** создайте коллекцию `staff`. Документ для сотрудника должен иметь **Document ID = UID пользователя** и поле `active` (Boolean) со значением `true`.
5. В **Firestore Database → Rules** скопируйте правила из файла `firestore.rules` и нажмите **Publish**. Загрузка файла в GitHub НЕ применяет правила к Firebase автоматически.
6. Войдите под учётной записью официанта на сайте. Теперь активные чеки загружаются из общей коллекции `receipts`.

## Поведение и ограничения

- Только зарегистрированные и разрешённые администратором сотрудники могут читать и редактировать чеки.
- Черновик хранится на устройстве; зарегистрированные чеки — в Firestore.
- Все разделы сайта (обучение, тесты и чеки) доступны только после входа авторизованного сотрудника с `staff/{uid}.active == true`.
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

## GitHub Actions Secrets and Variables

Исходный код **не содержит** Firebase config. Во время CI/CD скрипт `scripts/build.py` читает переменные окружения GitHub Actions и генерирует `dist/firebase-config.js`.

### Secrets — скрываемое значение

[Settings → Secrets and variables → Actions](https://github.com/zephyr363/korean-house-waiter-dashboard/settings/secrets/actions) → **Repository secrets** → New repository secret

| Name | Value |
| --- | --- |
| `FIREBASE_API_KEY` | API key из Firebase Console → Project settings → Your apps → Web App |

### Variables — конфигурация Firebase

На той же странице перейдите в **Variables** → New repository variable.

| Name | Value из Firebase конфигурации |
| --- | --- |
| `FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `FIREBASE_PROJECT_ID` | `projectId` — должен быть `korean-house-dashboard` |
| `FIREBASE_STORAGE_BUCKET` | `storageBucket` (необязательно) |
| `FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `FIREBASE_APP_ID` | `appId` |
| `FIREBASE_MEASUREMENT_ID` | `measurementId` (необязательно) |

Не добавляйте старый `FIREBASE_CONFIG_JSON`: он больше не используется.

### Публикация

1. GitHub → Settings → Pages → **Build and deployment → Source = GitHub Actions**.
2. В разделе [Actions](https://github.com/zephyr363/korean-house-waiter-dashboard/actions) выберите **Deploy Korean House to GitHub Pages** → **Run workflow**.
3. При каждом push в `main` сборка запускается автоматически. Если обязательное значение отсутствует, сборка завершится с сообщением о названии пропущенной переменной, **без печати значений**.

### Важно о безопасности

Данные не записаны в git, но **`dist/firebase-config.js` публикуется на GitHub Pages и доступен всем через браузер** — это стандартная клиентская конфигурация Firebase Web SDK. Это не способ сделать Web API key секретным от пользователей. Настоящие серверные секреты нельзя передавать браузеру: их хранят на backend/Secret Manager. Доступ к Firestore нужно ограничивать Security Rules и Auth. API key следует ограничить нужными API в Google Cloud Console; для снижения злоупотреблений можно дополнительно рассмотреть App Check. Старое значение Web API key остаётся в истории GitHub, даже после удаления из последнего коммита.

## Экран входа

При открытии сайта по умолчанию виден экран входа (email и пароль Firebase Authentication). Пока статус сотрудника не подтверждён в Firestore, доступ к страницам панели заблокирован. После входа открывается панель; в боковом меню доступна кнопка «Выйти из системы». При действующей Firebase-сессии выполняется автоматический вход после перезагрузки страницы и закрытия браузера. Кнопка «Выйти из системы» завершает сеанс и удаляет сохранённую авторизацию.

## Google Sign-In

В форме входа доступна кнопка **«Войти через Google»** с индикатором загрузки. После OAuth входа сайт обязательно проверяет `staff/{uid}.active == true`, как и для email/password. Никаких автоматических прав доступа Google-пользователям не выдаётся.

Обязательная разовая настройка в Firebase Console:
1. Authentication → Sign-in method → Google → **Enable** → выберите support email → Save.
2. Authentication → Settings → Authorized domains: убедитесь, что добавлен `zephyr363.github.io`. При необходимости добавьте его вручную.
3. После первой авторизации Google в Authentication → Users появится пользователь. Скопируйте **именно его UID** и добавьте Firestore-документ `staff/{uid}` с `active: true` (boolean), `role: "waiter"` или `role: "admin"`. UID может отличаться от ранее созданного Email/Password пользователя даже при одинаковом email. Не пытайтесь назначать права только по адресу почты.
4. Firestore Security Rules должны быть опубликованы в консоли; ошибки `permission-denied` не исправляются сменой способа входа.

Для входа используется popup. Браузеры могут блокировать всплывающие окна, особенно во встроенных браузерах мессенджеров; в таких случаях откройте сайт в Chrome/Safari. Сессия сохраняется через `browserLocalPersistence`: пользователь остаётся авторизованным после обновления страницы и перезапуска браузера до явного выхода из аккаунта или отзыва доступа.
