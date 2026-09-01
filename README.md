# FEI-Baja

## local (frontend)
```
cd frontend/
pnpm install
pnpm dev
```
acesso disponível em http://localhost:3000/


## ambiente virtual django (archlinux)
```
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m pip install django-cors-headers .
python3 manage.py runserver
```

## rodar localmente o postgresql 
``` 
docker-compose up -d
docker ps
```

## acesso admin
http://127.0.0.1:8000/admin/
user: ravi; senha: 123


https://github.com/yudielcurbelo/react-qr-scanner