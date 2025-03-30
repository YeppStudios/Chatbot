# Chatbot Project

## Opis projektu
Ten projekt to zaawansowany chatbot oparty na nowoczesnym stosie technologicznym. Wykorzystuje hybrydowe wyszukiwanie Retrieval-Augmented Generation (RAG) z Weaviate i Pinecone, modele językowe Anthropic i OpenAI (w tym OpenAI Assistants), MongoDB do przechowywania konwersacji, Next.js jako framework frontendowy oraz FastAPI jako backend. Frontend jest hostowany na Vercel, a backend na DigitalOcean. Autoryzacja opiera się na JWT, a procesy CI/CD są zautomatyzowane za pomocą GitHub Actions.

## Wymagania wstępne
Przed uruchomieniem projektu upewnij się, że masz zainstalowane następujące narzędzia:
- Node.js (v18 lub nowsza) - do uruchamiania frontendu (Next.js)
- npm - menedżer pakietów dla frontendu
- Python (v3.10 lub nowsza) - do uruchamiania backendu (FastAPI)
- Poetry - menedżer pakietów dla backendu
- Docker (opcjonalnie) - do uruchamiania usług takich jak MongoDB, Weaviate lub Pinecone lokalnie
- Git - do klonowania repozytorium

## Struktura projektu
- `frontend/`: Kod Next.js dla interfejsu użytkownika
- `backend/`: Kod FastAPI dla logiki serwera i integracji z LLM oraz bazami danych
- `.github/workflows/`: Pliki konfiguracyjne CI/CD dla GitHub Actions

## Jak uruchomić projekt

### 1. Sklonuj repozytorium
```bash
git clone https://github.com/your-username/chatbot-project.git
cd chatbot-project
```

### 2. Konfiguracja frontendu (Next.js)
Przejdź do katalogu frontendu:
```bash
cd frontend
```

Zainstaluj zależności:
```bash
npm install
```

Utwórz plik `.env.local` w katalogu `frontend/` i dodaj następujące zmienne środowiskowe:
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_BACKEND_API_SERVER_URL=https://your-backend-api-url
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

Uruchom frontend w trybie deweloperskim:
```bash
npm run dev
```
Frontend będzie dostępny pod adresem http://localhost:3000.

### 3. Konfiguracja backendu (FastAPI)
Przejdź do katalogu backendu:
```bash
cd backend
```

Zainstaluj Poetry (jeśli jeszcze nie jest zainstalowane):
```bash
pip install poetry
```

Zainstaluj zależności projektu:
```bash
poetry install
```

Utwórz plik `.env` w katalogu `backend/` i dodaj następujące zmienne środowiskowe:
```
ANTHROPIC_API_KEY=your-anthropic-api-key
DIGITALOCEAN_ACCESS_TOKEN=your-digitalocean-access-token
DIGITALOCEAN_SSH_HOST=your-digitalocean-ssh-host
DIGITALOCEAN_SSH_KEY=your-digitalocean-ssh-key
DIGITALOCEAN_SSH_KEY_PUB=your-digitalocean-ssh-public-key
DIGITALOCEAN_SSH_USER=your-digitalocean-ssh-user
JWT_SECRET_KEY=your-jwt-secret-key
MONGODB_URI=mongodb://localhost:27017/your-database-name
OPENAI_API_KEY=your-openai-api-key
PINECONE_API_KEY=your-pinecone-api-key
SSH_KEY_PASSPHRASE=your-ssh-key-passphrase
WEAVIATE_API_KEY=your-weaviate-api-key
WEAVIATE_URL=your-weaviate-url
```

Aktywuj środowisko Poetry:
```bash
poetry shell
```

Uruchom backend:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Backend będzie dostępny pod adresem http://localhost:8000.

### 4. Usługi zewnętrzne
**MongoDB**: Załóż konto lub zaloguj się do wspólnego konta i podaj connection string.

**Weaviate**: Skonfiguruj lokalnie lub użyj chmurowej instancji (patrz dokumentacja Weaviate).

**Pinecone**: Utwórz indeks w Pinecone i skonfiguruj klucz API.

### 5. Deployment
**Frontend**: Deploy na Vercel poprzez integrację z GitHub. Ustaw zmienne środowiskowe w panelu Vercel.

**Backend**: Deploy na DigitalOcean z użyciem GitHub Actions. Pliki konfiguracyjne CI/CD znajdują się w `.github/workflows/`.

## Dodatkowe uwagi
Upewnij się, że wszystkie zmienne środowiskowe są poprawnie skonfigurowane, aby uniknąć błędów autoryzacji lub połączenia z usługami zewnętrznymi.

W przypadku korzystania z OpenAI Assistants, skonfiguruj asystentów i vector stores za pomocą odpowiednich endpointów API (np. `/assistant`, `/vector-store`).

Testowe trasy upsertowania (`/pinecone-upsert`, `/weaviate-upsert`) oraz scrapowania (`/scrape-course-content`) mogą być używane do ładowania danych do baz wektorowych.

