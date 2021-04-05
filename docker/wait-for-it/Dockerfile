FROM debian

RUN apt update && apt install wait-for-it && apt-get clean
RUN useradd -ms /bin/bash waituser
USER waituser

ENTRYPOINT ["wait-for-it"]