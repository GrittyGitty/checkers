FROM rust:1.61 as builder
WORKDIR /usr/src/checkers
COPY . .
RUN cargo install --path .

FROM debian:buster-slim
COPY --from=builder /usr/local/cargo/bin/ws /usr/local/bin/ws
EXPOSE 8080
CMD ["ws"]