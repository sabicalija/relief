# RelieF

Monorepo for relief pipeline.

- `apps/api` — FastAPI depth service (Docker)
- `apps/web` — Frontend (later)
- `infra` — Cloud configs (later)

## Quick start (API)

```bash
docker build -t relief-depth-api ./apps/api
docker run --rm -p 8080:8080 relief-depth-api
curl http://localhost:8080/healthz
curl -X POST -F image=@/path/to/any.jpg http://localhost:8080/depth -o depth.png -D headers.txt
sed -n 's/^X-Depth-Meta: //p' headers.txt
```