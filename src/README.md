
```
src
├─ .DS_Store
├─ backend
│  ├─ .DS_Store
│  ├─ .ebextensions
│  │  └─ nginx.config
│  ├─ .env
│  ├─ .npmrc
│  ├─ Arquivo 2.zip
│  ├─ Arquivo 3.zip
│  ├─ Arquivo 4.zip
│  ├─ Arquivo.zip
│  ├─ Procfile
│  ├─ dist
│  │  ├─ adapters
│  │  │  └─ S3StorageAdapter.js
│  │  ├─ core
│  │  │  ├─ GestClinicaFacade.js
│  │  │  ├─ GestFaturacaoFacade.js
│  │  │  ├─ GestHospedesFacade.js
│  │  │  ├─ GestOperacoesFacade.js
│  │  │  ├─ GestReservasFacade.js
│  │  │  └─ GestorHotelFacade.js
│  │  ├─ dao
│  │  │  ├─ AnimalDAO.js
│  │  │  ├─ CheckDiarioDAO.js
│  │  │  ├─ DiarioBordoDAO.js
│  │  │  ├─ FaturaDAO.js
│  │  │  ├─ LogsDAO.js
│  │  │  ├─ PrescricaoDAO.js
│  │  │  ├─ ReservaDAO.js
│  │  │  ├─ StockDAO.js
│  │  │  └─ UtilizadorDAO.js
│  │  ├─ index.js
│  │  ├─ jobs
│  │  │  ├─ RacaoJobs.js
│  │  │  ├─ ReservaJobs.js
│  │  │  ├─ TarefasJobs.js
│  │  │  └─ VeterinariaJobs.js
│  │  ├─ middleware
│  │  │  └─ auth.js
│  │  ├─ routes
│  │  │  └─ api.js
│  │  ├─ seed.js
│  │  ├─ services
│  │  │  ├─ EmailService.js
│  │  │  └─ TwoFactorService.js
│  │  └─ tests
│  │     ├─ integration
│  │     │  ├─ auth.test.js
│  │     │  ├─ extra_int.test.js
│  │     │  ├─ reservas.test.js
│  │     │  └─ veterinaria.test.js
│  │     └─ unit
│  │        ├─ GestClinicaFacade.test.js
│  │        ├─ GestClinicaFacade_extra.test.js
│  │        ├─ GestFaturacaoFacade.test.js
│  │        ├─ GestHospedesFacade.test.js
│  │        ├─ GestHotelFacade.test.js
│  │        ├─ GestOperacoesFacade.test.js
│  │        ├─ GestReservasFacade.test.js
│  │        └─ GestReservasFacade_extra.test.js
│  ├─ jest.config.ts
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ prisma
│  │  ├─ migrations
│  │  │  ├─ 20260415141517_init
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260426223220_add_perfil_rececao
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260427160401_add_estado_servico
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260504105158_atualizacao_stock_prescricoes
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260506141408_check_diario_booleano
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260506161357_ligar_logs_a_prescricoes
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260506163347_total_doses
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260508135212_novas_tarefas_staff
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260508172410_add_termos_pagamentos
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260508221922_boxes_regras
│  │  │  │  └─ migration.sql
│  │  │  └─ migration_lock.toml
│  │  └─ schema.prisma
│  ├─ src
│  │  ├─ .DS_Store
│  │  ├─ adapters
│  │  │  └─ S3StorageAdapter.ts
│  │  ├─ core
│  │  │  ├─ GestClinicaFacade.ts
│  │  │  ├─ GestFaturacaoFacade.ts
│  │  │  ├─ GestHospedesFacade.ts
│  │  │  ├─ GestOperacoesFacade.ts
│  │  │  ├─ GestReservasFacade.ts
│  │  │  └─ GestorHotelFacade.ts
│  │  ├─ dao
│  │  │  ├─ AnimalDAO.ts
│  │  │  ├─ DiarioBordoDAO.ts
│  │  │  ├─ FaturaDAO.ts
│  │  │  ├─ LogsDAO.ts
│  │  │  ├─ PrescricaoDAO.ts
│  │  │  ├─ ReservaDAO.ts
│  │  │  ├─ StockDAO.ts
│  │  │  └─ UtilizadorDAO.ts
│  │  ├─ index.ts
│  │  ├─ jobs
│  │  │  ├─ ReservaJobs.ts
│  │  │  ├─ TarefasJobs.ts
│  │  │  └─ VeterinariaJobs.ts
│  │  ├─ middleware
│  │  │  └─ auth.ts
│  │  ├─ routes
│  │  │  └─ api.ts
│  │  ├─ seed.ts
│  │  ├─ services
│  │  │  ├─ EmailService.ts
│  │  │  └─ TwoFactorService.ts
│  │  └─ tests
│  │     ├─ integration
│  │     │  ├─ DAO.test.ts
│  │     │  ├─ DAOs.test.ts
│  │     │  ├─ auth.test.ts
│  │     │  ├─ extra_int.test.ts
│  │     │  ├─ reservas.test.ts
│  │     │  └─ veterinaria.test.ts
│  │     └─ unit
│  │        ├─ DAO.test.ts
│  │        ├─ DAOs.test.ts
│  │        ├─ GestClinicaFacade.test.ts
│  │        ├─ GestClinicaFacade_extra.test.ts
│  │        ├─ GestFaturacaoFacade.test.ts
│  │        ├─ GestHospedesFacade.test.ts
│  │        ├─ GestHotelFacade.test.ts
│  │        ├─ GestOperacoesFacade.test.ts
│  │        ├─ GestReservasFacade.test.ts
│  │        └─ GestReservasFacade_extra.test.ts
│  ├─ test_output.log
│  └─ tsconfig.json
└─ frontend
   ├─ .DS_Store
   ├─ README.md
   ├─ dist
   │  ├─ assets
   │  │  ├─ foto-BmD4wRyp.webp
   │  │  ├─ index-9xlHPp03.js
   │  │  └─ index-C3m-wagg.css
   │  ├─ favicon.svg
   │  ├─ icons.svg
   │  └─ index.html
   ├─ eslint.config.js
   ├─ foto.png
   ├─ foto.webp
   ├─ index.html
   ├─ package-lock.json
   ├─ package.json
   ├─ playwright.config.ts
   ├─ public
   │  ├─ favicon.svg
   │  └─ icons.svg
   ├─ src
   │  ├─ App.tsx
   │  ├─ ProtectedRoute.tsx
   │  ├─ assets
   │  │  ├─ Screenshot from 2026-04-30 19-42-31.png
   │  │  ├─ hero.png
   │  │  ├─ react.svg
   │  │  └─ vite.svg
   │  ├─ components
   │  │  ├─ Footer.tsx
   │  │  ├─ Header.tsx
   │  │  └─ Shared.css
   │  ├─ index.css
   │  ├─ main.tsx
   │  └─ pages
   │     ├─ AuthPages.css
   │     ├─ DiarioBordoPage.css
   │     ├─ DiarioBordoPage.tsx
   │     ├─ GatewayGestoraPage.css
   │     ├─ GatewayGestoraPage.tsx
   │     ├─ GestoraPage.css
   │     ├─ GestoraPage.tsx
   │     ├─ HomePage.css
   │     ├─ HomePage.tsx
   │     ├─ LoginPage.tsx
   │     ├─ MarcacoesPage.css
   │     ├─ MarcacoesPage.tsx
   │     ├─ MinhasFaturasPage.tsx
   │     ├─ PortalTutor.css
   │     ├─ PortalTutor.tsx
   │     ├─ RececaoPage.css
   │     ├─ RececaoPage.tsx
   │     ├─ RegisterPage.tsx
   │     ├─ StaffPage.css
   │     ├─ StaffPage.tsx
   │     ├─ VeterinariaPage.css
   │     └─ VeterinariaPage.tsx
   ├─ tests
   │  ├─ login.spec.ts
   │  ├─ staff.spec.ts
   │  ├─ staff_limpar.spec.ts
   │  ├─ tutor.spec.ts
   │  └─ veterinario.spec.ts
   ├─ tsconfig.app.json
   ├─ tsconfig.json
   ├─ tsconfig.node.json
   └─ vite.config.ts

```