help: ## Show this help.
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/##//'

## Docker Container Management
up: ## start docker containers
	docker-compose up -d

down: ## end docker containers
	docker-compose down  

down-volumes: ## stop containers and remove volumes (⚠️  deletes all data)
	docker-compose down -v

rehard: ## restart hard (down and then up again)
	docker-compose down && docker-compose up -d 

re: ## restart all containers
	docker-compose restart

status: ## show container status
	docker-compose ps

## Container Access
enter-api: ## enter api container
	docker-compose exec api /bin/sh

enter-webclient: ## enter webclient container
	docker-compose exec webclient /bin/sh

enter-postgres: ## enter postgres container
	docker-compose exec postgres psql -U postgres -d eventos2_db

enter-pgadmin: ## open pgAdmin in browser
	@echo "Opening pgAdmin at http://localhost:8080"
	@echo "Email: admin@eventos2.com"
	@echo "Password: admin"

## Database Management
db-migrate: ## run database migrations (when using Prisma/TypeORM)
	docker-compose exec api npm run db:migrate

db-seed: ## seed database with initial data
	docker-compose exec api npm run db:seed

db-reset: ## reset database (⚠️  deletes all data)
	docker-compose exec api npm run db:reset

db-studio: ## open database studio/admin interface
	docker-compose exec api npm run db:studio

db-generate: ## generate database client/entities
	docker-compose exec api npm run db:generate

## NestJS Development
api-install: ## install npm packages in api container
	docker-compose exec api npm install

api-clean-install: ## clean install (removes node_modules volume first)
	docker volume rm eventos2_api_node_modules || true
	docker-compose restart api
	docker-compose exec api npm install

api-generate: ## generate NestJS resource (usage: make api-generate name=user)
	docker-compose exec api nest generate resource $(name)

api-controller: ## generate NestJS controller (usage: make api-controller name=users)
	docker-compose exec api nest generate controller $(name)

api-service: ## generate NestJS service (usage: make api-service name=users)
	docker-compose exec api nest generate service $(name)

api-module: ## generate NestJS module (usage: make api-module name=users)
	docker-compose exec api nest generate module $(name)

api-test: ## run api tests
	docker-compose exec api npm run test

api-test-watch: ## run api tests in watch mode
	docker-compose exec api npm run test:watch

api-test-e2e: ## run api e2e tests
	docker-compose exec api npm run test:e2e

api-lint: ## run api linting
	docker-compose exec api npm run lint

api-format: ## format api code
	docker-compose exec api npm run format

api-build: ## build api for production
	docker-compose exec api npm run build

## Next.js Development
web-install: ## install npm packages in webclient container
	docker-compose exec webclient npm install

web-clean-install: ## clean install webclient (removes node_modules volume first)
	docker volume rm eventos2_webclient_node_modules || true
	docker-compose restart webclient
	docker-compose exec webclient npm install

web-build: ## build webclient for production
	docker-compose exec webclient npm run build

web-lint: ## run webclient linting
	docker-compose exec webclient npm run lint

web-type-check: ## run TypeScript type checking in webclient
	docker-compose exec webclient npm run type-check

logs-webclient: ## view webclient logs
	docker-compose logs -f webclient

## Logs
logs: ## view all logs
	docker-compose logs -f

logs-api: ## view api logs
	docker-compose logs -f api

logs-postgres: ## view database logs
	docker-compose logs -f postgres

logs-pgadmin: ## view pgAdmin logs
	docker-compose logs -f pgadmin

## Development & Building
build: ## build all images
	docker-compose build

build-api: ## build only api image
	docker-compose build api

dev: ## start development environment with logs
	docker-compose up

## Docker Cleanup
volumes-list: ## list all volumes
	docker volume ls

volumes-clean: ## remove unused volumes
	docker volume prune -f

images-clean: ## remove unused images
	docker image prune -f

system-clean: ## clean entire docker system (⚠️  removes everything unused)
	docker system prune -af

## Production
prod-up: ## start production environment
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

prod-down: ## stop production environment
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

prod-logs: ## view production logs
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

## Git Operations
git-all: ## commit and push all changes (usage: make git-all m="commit message")
	git status && git add . && git commit -m"$(m)" && git push && git status

git-api: ## commit and push api changes (usage: make git-api m="commit message")
	git status && git add api && git commit -m"$(m)" && git push && git status

## Initialization
init: ## initialize project for first time
	@echo "🚀 Initializing eventos2 development environment..."
	cp .env.example .env.local
	docker-compose build
	docker-compose up -d
	@echo "✅ Environment ready!"
	@echo "📋 Access URLs:"
	@echo "   - API: http://localhost:3000"
	@echo "   - Frontend: http://localhost:3001"
	@echo "   - pgAdmin: http://localhost:8080 (admin@eventos2.com / admin)"
	@echo "   - PostgreSQL: localhost:5432 (postgres / postgres)"

setup-nestjs: ## setup NestJS in api folder (run this after init)
	@echo "🏗️  Setting up NestJS..."
	@echo "📁 Creating NestJS project structure..."
	cd api && npx @nestjs/cli new . --skip-git --skip-install --package-manager npm
	@echo "🔧 Installing dependencies..."
	make api-install
	@echo "✅ NestJS setup complete!"
	@echo "🚀 You can now start development with: make up"

setup-nextjs: ## setup Next.js in webclient folder (run this after init)
	@echo "🏗️  Setting up Next.js..."
	@echo "📁 Creating Next.js project structure..."
	cd webclient && npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --no-git
	@echo "🔧 Installing dependencies..."
	make web-install
	@echo "✅ Next.js setup complete!"
	@echo "🚀 You can now start development with: make up"