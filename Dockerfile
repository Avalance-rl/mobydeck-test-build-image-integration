FROM alpine:3.20

RUN echo "hello from mobydeck test fixture" > /greeting.txt

CMD ["cat", "/greeting.txt"]