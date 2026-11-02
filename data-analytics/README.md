# Guide to run the project

## Setup

### Install uv

curl -LsSf https://astral.sh/uv/install.sh | sh

### Create venv

uv venv --python 3.11.9 .venv

### Install libs

uv pip install .
(or) uv pip install -e .

### Set pre-commit

pre-commit install

## Run service

### Set environment variables

export MISTRAL_API_KEY=<your-mistral-api-key>

### Run fastapi

fastapi dev main.py

### Run call_llm_service

python call_llm_service.py "conversation id" "input prompt" "response text" true

## Docker

docker buildx build --platform=linux/amd64 -f Dockerfile -t cop-pilot-eu/cop-pilot-llm-observability-analytics:0.1.0 --no-cache .
docker run -e MISTRAL_API_KEY --name cop-pilot-llm-observability-analytics -p 8000:8000 cop-pilot-eu/cop-pilot-llm-observability-analytics:0.1.0
docker push cop-pilot-eu/cop-pilot-llm-observability-analytics:0.1.0
