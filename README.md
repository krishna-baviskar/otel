# OpenTelemetry and Dynatrace
 
Microservice-based demo project showcasing Dynatrace's tracing functionality in combination with OpenTelemetry.

Author: **[Krishna Baviskar](https://github.com/krishna-baviskar)**  
Repository: **[https://github.com/krishna-baviskar/otel](https://github.com/krishna-baviskar/otel)**

![Architecture](https://raw.githubusercontent.com/krishna-baviskar/otel/main/docs/img/architecture-diagram.png)

## The Showcase

The application itself does not really have a specific purpose nor offers a beautiful UI. It just provides one simple endpoint for users to sign up with email, name and password and sends out a confirmation mail afterwards. All service communication is done via HTTP.

While there are some surrounding services to make this a more representative example, the main components are the following:

1. Backend Service
2. Mail Service
3. Template Service

Backend Service and Template Service are going to be monitored via the OneAgent and will create some custom OpenTelemetry spans via manual instrumentation. The service in the middle - the Mail Service - is going to be instrumented with OpenTelemetry only.

The signup procedure can be described in 6 simple steps:

1. Signup-endpoint gets called with an HTTP-post call having email, name and password in the body
2. After email address validation, the user gets stored into the mongo database
3. Backend Service calls Mail Service's send-endpoint via HTTP-post to send a signup confirmation mail
4. Mail Service calls Template Service via gRPC to render the email body
5. After rendering the email, the Template Service stores the result in the Redis cache and returns
6. Finally, the Mail Service calls an external mail-as-a-service provider (e.g. Sendgrid) to send the email

## Run the Demo

There are two ways to run this demo:

- **Local Dev (Grafana & Tempo)**: Run `docker compose up -d` in the root folder. Traces are stored in Tempo and viewable in Grafana (`http://localhost:3000`).
- **Dynatrace (OneAgent & Operator)**:
  - [Docker Compose](https://github.com/krishna-baviskar/otel/tree/main/compose) - OneAgent deployed as Docker container
  - [Kubernetes](https://github.com/krishna-baviskar/otel/tree/main/kubernetes) - OneAgent deployment via Dynatrace Operator

### Author & Support

- **Author**: [Krishna Baviskar](https://github.com/krishna-baviskar)
- **GitHub**: [https://github.com/krishna-baviskar/otel](https://github.com/krishna-baviskar/otel)
- **Issues**: [https://github.com/krishna-baviskar/otel/issues](https://github.com/krishna-baviskar/otel/issues)
