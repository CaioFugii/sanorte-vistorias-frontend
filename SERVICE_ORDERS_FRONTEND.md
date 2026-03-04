# Ordens de Serviço – Uso no Frontend

## Listar ordens de serviço (com paginação e filtro)

### Endpoint

```
GET /service-orders
```

Requer autenticação (Bearer JWT). Roles permitidos: `ADMIN`, `GESTOR`, `FISCAL`.

---

### Query params

| Parâmetro  | Tipo   | Obrigatório | Default | Descrição |
|------------|--------|-------------|---------|-----------|
| `page`     | number | Não         | 1       | Página (≥ 1) |
| `limit`    | number | Não         | 10      | Itens por página (1–100) |
| `osNumber` | string | Não         | —       | Filtro pelo número da OS (busca parcial). Ex: `269258` encontra `269258409` |
| `sectorId` | string | Não         | —       | UUID do setor. Filtra por setor (AGUA, ESGOTO, REPOSICAO). Obtenha os IDs em `GET /sectors`. |

---

### Exemplos de URL

```text
GET /service-orders
GET /service-orders?page=1&limit=20
GET /service-orders?osNumber=269258409
GET /service-orders?sectorId=uuid-do-setor-agua
GET /service-orders?page=2&limit=10&osNumber=269258&sectorId=uuid-do-setor
```

---

### Resposta (200 OK)

Resposta paginada: lista em `data` e metadados em `meta`.

```json
{
  "data": [
    {
      "id": "uuid",
      "osNumber": "269258409",
      "sectorId": "uuid-do-setor",
      "sector": {
        "id": "uuid-do-setor",
        "name": "AGUA",
        "active": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      "address": "Rua Exemplo - 123 - Centro",
      "field": false,
      "remote": false,
      "postWork": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### Tipos TypeScript (frontend)

```ts
interface Sector {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ServiceOrder {
  id: string;
  osNumber: string;
  sectorId: string;
  sector: Sector;
  address: string;
  field: boolean;
  remote: boolean;
  postWork: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ServiceOrdersMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ServiceOrdersResponse {
  data: ServiceOrder[];
  meta: ServiceOrdersMeta;
}

// Parâmetros da requisição
interface ServiceOrdersParams {
  page?: number;
  limit?: number;
  osNumber?: string;
  sectorId?: string; // UUID do setor (AGUA, ESGOTO, REPOSICAO) – use GET /sectors para listar
}
```

---

### Exemplo com `fetch`

```ts
const API_BASE = 'https://sua-api.com'; // ou import de config

async function getServiceOrders(params: ServiceOrdersParams = {}): Promise<ServiceOrdersResponse> {
  const searchParams = new URLSearchParams();

  if (params.page != null) searchParams.set('page', String(params.page));
  if (params.limit != null) searchParams.set('limit', String(params.limit));
  if (params.osNumber?.trim()) searchParams.set('osNumber', params.osNumber.trim());
  if (params.sectorId) searchParams.set('sectorId', params.sectorId);

  const url = `${API_BASE}/service-orders?${searchParams.toString()}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`, // seu método de token
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) throw new Error(`Erro ${res.status}`);
  return res.json();
}

// Uso
const result = await getServiceOrders({ page: 1, limit: 20, osNumber: '269258' });
const bySector = await getServiceOrders({ sectorId: 'uuid-do-setor-AGUA' });
console.log(result.data);      // lista de OS
console.log(result.meta.total); // total de registros
```

---

### Exemplo com React (estado + tabela paginada)

```tsx
const [page, setPage] = useState(1);
const [limit] = useState(10);
const [osNumber, setOsNumber] = useState('');
const [sectorId, setSectorId] = useState<string>(''); // UUID do setor (ex.: do GET /sectors)
const [result, setResult] = useState<ServiceOrdersResponse | null>(null);
const [loading, setLoading] = useState(false);

useEffect(() => {
  let cancelled = false;
  setLoading(true);
  getServiceOrders({ page, limit, osNumber: osNumber || undefined, sectorId: sectorId || undefined })
    .then((res) => { if (!cancelled) setResult(res); })
    .finally(() => { if (!cancelled) setLoading(false); });
  return () => { cancelled = true; };
}, [page, limit, osNumber, sectorId]);

// Filtro por número da OS (ex.: campo de busca)
const handleSearch = (value: string) => {
  setOsNumber(value);
  setPage(1);
};
// Filtro por setor (ex.: select com opções AGUA, ESGOTO, REPOSICAO – use IDs de GET /sectors)
const handleSectorChange = (id: string) => {
  setSectorId(id);
  setPage(1);
};

// Meta para botões anterior/próximo
const meta = result?.meta;
const canPrev = meta?.hasPrev ?? false;
const canNext = meta?.hasNext ?? false;
```

---

### Erros comuns

| Status | Significado |
|--------|-------------|
| 401    | Token ausente ou inválido |
| 403    | Usuário sem perfil ADMIN, GESTOR ou FISCAL |
| 400    | Query inválida (ex.: `page` ou `limit` fora do permitido) |

Validação dos query params (ex.: `page` ≥ 1, `limit` entre 1 e 100) é feita pelo backend; o frontend pode enviar os valores e tratar 400 se necessário.
