FROM python:3.8-alpine

ADD requirements.txt requirements.txt
ADD app.py app.py
ADD rule-engine-bundled-0.1.jar rule-engine-bundled-0.1.jar
RUN pip install -r requirements.txt

CMD python app.py rule-engine-bundled-0.1.jar