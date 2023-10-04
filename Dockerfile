FROM python:alpine

WORKDIR /app

COPY ./main.py /app/main.py
COPY ./requirements.txt /app/requirements.txt

RUN apk --no-cache add build-base
RUN apk --no-cache add postgresql-dev

RUN pip install -r /app/requirements.txt

CMD ["python", "/app/main.py"]
